import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { Activity } from '../entities/activity.entity';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityCheckException } from '../exceptions/activity-check.exception';
import { UserActivityCheck } from '../entities/user-activity-check.entity';

@Injectable()
export class CheckActivityService {
  private readonly logger = new Logger(CheckActivityService.name);

  constructor(private readonly activitiesRepository: ActivitiesRepository) {}

  async execute(
    user: AuthUser,
    activityId: number,
  ): Promise<UserActivityCheck> {
    this.logger.log({
      message: 'Executing checkActivity',
      userId: user.id,
      activityId,
    });

    if (user.isBlocked) throw new UserBlockedException();

    const activity = await this.findActivity(activityId);
    const check = await this.createCheck(user.id, activity.id);

    this.logger.log({
      message: 'Successfully checked activity',
      userId: user.id,
      activityId,
    });

    return check;
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

      throw new ActivityCheckException();
    }

    if (!activity) {
      throw new ActivityNotFoundException();
    }

    return activity;
  }

  private async createCheck(
    userId: number,
    activityId: number,
  ): Promise<UserActivityCheck> {
    try {
      return await this.activitiesRepository.createCheck(userId, activityId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating activity check',
        userId,
        activityId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityCheckException();
    }
  }
}
