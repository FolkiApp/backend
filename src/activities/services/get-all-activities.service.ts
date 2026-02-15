import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { Activity } from '../entities/activity.entity';
import { ActivitiesFetchException } from '../exceptions/activities-fetch.exception';

@Injectable()
export class GetAllActivitiesService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(GetAllActivitiesService.name);
  }

  async execute(user: AuthUser): Promise<Activity[]> {
    this.logger.log({
      message: 'Executing getAllActivities',
      userId: user.id,
    });

    try {
      const fetchedActivities = await this.getAllActivitiesFromUser(user.id);
      const sortedActivities = this.sortActivities(fetchedActivities);

      this.logger.log({
        message: 'Successfully fetched activities',
        userId: user.id,
        total: sortedActivities.length,
      });

      return sortedActivities;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching activities',
        userId: user.id,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivitiesFetchException();
    }
  }

  private async getAllActivitiesFromUser(userId: number): Promise<Activity[]> {
    const currentYear = new Date().getFullYear();

    const activities = await this.activitiesRepository.findAllByUser(
      userId,
      currentYear,
    );

    return activities;
  }

  private sortActivities(activities: Activity[]): Activity[] {
    const today = new Date();

    const notFinishedActivities = activities.filter(
      (activity) => new Date(activity.finishDate) > today,
    );

    const finishedActivities = activities.filter(
      (activity) => new Date(activity.finishDate) <= today,
    );

    return [...notFinishedActivities, ...finishedActivities];
  }
}
