import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { Activity } from '../entities/activity.entity';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityIgnoreException } from '../exceptions/activity-ignore.exception';

@Injectable()
export class IgnoreActivityService {
  private readonly logger = new Logger(IgnoreActivityService.name);

  constructor(private readonly activitiesRepository: ActivitiesRepository) {}

  async execute(user: AuthUser, activityId: number): Promise<void> {
    this.logger.log({
      message: 'Executing ignoreActivity',
      userId: user.id,
      activityId,
    });

    if (user.isBlocked) throw new UserBlockedException();

    const activity = await this.findActivity(activityId);
    await this.createIgnore(user.id, activity.id);

    this.logger.log({
      message: 'Successfully ignored activity',
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

      throw new ActivityIgnoreException();
    }

    if (!activity) {
      throw new ActivityNotFoundException();
    }

    return activity;
  }

  private async createIgnore(
    userId: number,
    activityId: number,
  ): Promise<void> {
    try {
      await this.activitiesRepository.createIgnore(userId, activityId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating activity ignore',
        userId,
        activityId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityIgnoreException();
    }
  }
}
