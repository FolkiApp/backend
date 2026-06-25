import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { Activity } from '../entities/activity.entity';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { PermissionDeniedToDeleteException } from '../exceptions/permission-denied-to-delete.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityDeleteException } from '../exceptions/activity-delete.exception';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { SubjectClass } from '../../subjects/entities/subject-class.entity';

@Injectable()
export class DeleteActivityService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly subjectClassRepository: SubjectClassRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(DeleteActivityService.name);
  }

  async execute(user: AuthUser, activityId: number): Promise<void> {
    this.logger.log({
      message: 'Executing deleteActivity',
      userId: user.id,
      activityId,
    });

    if (user.isBlocked) throw new UserBlockedException();

    const activity = await this.findActivity(activityId);
    await this.verifyUserCanDelete(user.id, activity);

    await this.deleteActivity(activityId);

    this.logger.log({
      message: 'Successfully deleted activity',
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

      throw new ActivityDeleteException();
    }

    if (!activity) {
      throw new ActivityNotFoundException();
    }

    return activity;
  }

  private async verifyUserCanDelete(
    userId: number,
    activity: Activity,
  ): Promise<void> {
    const isUserOwner = activity.userId === userId;

    if (isUserOwner) return;

    if (activity.isPrivate) {
      throw new PermissionDeniedToDeleteException();
    }

    const subjectClass = await this.getSubjectClass(
      activity.subjectClassId,
      userId,
    );

    if (!subjectClass) {
      throw new PermissionDeniedToDeleteException(
        'Você não tem permissão para deletar essa atividade',
      );
    }
  }

  private async getSubjectClass(
    subjectClassId: number,
    userId: number,
  ): Promise<SubjectClass | null> {
    try {
      return await this.subjectClassRepository.findByIdAndUserId(
        subjectClassId,
        userId,
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error getting subject class',
        userId,
        subjectClassId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityDeleteException();
    }
  }

  private async deleteActivity(activityId: number): Promise<void> {
    try {
      await this.activitiesRepository.softDelete(activityId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error deleting activity',
        activityId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityDeleteException();
    }
  }
}
