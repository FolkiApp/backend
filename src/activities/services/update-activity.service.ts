import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { Activity } from '../entities/activity.entity';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { PermissionDeniedToUpdateException } from '../exceptions/permission-denied-to-update.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityUpdateException } from '../exceptions/activity-update.exception';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UpdateActivityData } from '../repositories/dto/update-activity-data.dto';
import { SubjectClass } from 'src/subjects/entities/subject-class.entity';

@Injectable()
export class UpdateActivityService {
  private readonly logger = new Logger(UpdateActivityService.name);

  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly subjectClassRepository: SubjectClassRepository,
  ) {}

  async execute(
    user: AuthUser,
    activityId: number,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity> {
    this.logger.log({
      message: 'Executing updateActivity',
      userId: user.id,
      activityId,
    });

    if (user.isBlocked) throw new UserBlockedException();

    const activity = await this.findActivity(activityId);
    await this.verifyUserPermission(user.id, activity.subjectClassId);

    const previousFinishDate = activity.finishDate;
    const updatedActivity = await this.updateActivity(
      activityId,
      updateActivityDto,
    );

    this.handleDateChangeNotification(
      activity,
      previousFinishDate,
      updateActivityDto,
    );

    this.logger.log({
      message: 'Successfully updated activity',
      userId: user.id,
      activityId,
    });

    return updatedActivity;
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

      throw new ActivityUpdateException();
    }

    if (!activity) {
      throw new ActivityNotFoundException();
    }

    return activity;
  }

  private async verifyUserPermission(
    userId: number,
    subjectClassId: number,
  ): Promise<void> {
    const subjectClass = await this.getSubjectClass(subjectClassId, userId);

    if (!subjectClass) {
      throw new PermissionDeniedToUpdateException(
        'Você não tem permissão para atualizar essa atividade',
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

      throw new ActivityUpdateException();
    }
  }

  private async updateActivity(
    activityId: number,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity> {
    try {
      const finishDate = updateActivityDto.finishDate
        ? this.createDateWithDefaultTime(updateActivityDto.finishDate)
        : undefined;

      const updateData = new UpdateActivityData(
        updateActivityDto.name,
        updateActivityDto.description,
        updateActivityDto.value,
        updateActivityDto.type,
        finishDate,
        updateActivityDto.isPrivate,
      );

      const activity = await this.activitiesRepository.update(
        activityId,
        updateData,
      );

      return activity;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error updating activity',
        activityId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityUpdateException();
    }
  }

  private createDateWithDefaultTime(dateString: string): Date {
    const date = new Date(dateString);
    date.setHours(15, 0, 0, 0);
    return date;
  }

  private handleDateChangeNotification(
    activity: Activity,
    previousFinishDate: Date,
    updateActivityDto: UpdateActivityDto,
  ) {
    const dateChanged =
      updateActivityDto.finishDate &&
      new Date(previousFinishDate).toDateString() !==
        new Date(updateActivityDto.finishDate).toDateString();

    if (dateChanged && !activity.isPrivate) {
      // TODO: Implementar sendUpdateActivityNotification
      this.logger.log({
        message: 'Activity date changed, notification should be sent',
        activityId: activity.id,
        subjectClassId: activity.subjectClassId,
      });
    }
  }
}
