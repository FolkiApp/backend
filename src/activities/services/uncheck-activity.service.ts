import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { Activity } from '../entities/activity.entity';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityUncheckException } from '../exceptions/activity-uncheck.exception';

@Injectable()
export class UncheckActivityService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(UncheckActivityService.name);
  }

  async execute(user: AuthUser, activityId: number): Promise<void> {
    this.logger.log({
      message: 'Executing uncheckActivity',
      userId: user.id,
      activityId,
    });

    if (user.isBlocked) throw new UserBlockedException();

    const activity = await this.findActivity(activityId);
    await this.deleteCheck(user.id, activity.id);

    this.logger.log({
      message: 'Successfully unchecked activity',
      userId: user.id,
      activityId,
    });
  }

  private async findActivity(activityId: number): Promise<Activity> {
    let activity: Activity | null;

    try {
      activity = await this.activitiesRepository.findById(activityId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error finding activity',
        activityId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityUncheckException();
    }

    if (!activity) {
      throw new ActivityNotFoundException();
    }

    return activity;
  }

  private async deleteCheck(userId: number, activityId: number): Promise<void> {
    try {
      await this.activitiesRepository.deleteCheck(userId, activityId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error deleting activity check',
        userId,
        activityId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityUncheckException();
    }
  }
}
