import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { CustomLogger } from '../../common/logger/custom-logger.service';
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
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';

@Injectable()
export class UpdateActivityService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly notificationQueueService: NotificationQueueService,
    private readonly userSubjectsRepository: UserSubjectsRepository,
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly subjectClassRepository: SubjectClassRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(UpdateActivityService.name);
  }

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

    await this.handleDateChangeNotification(
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
        updateActivityDto.deletedAt,
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

  private hasDateChanged(
    previousDate: Date,
    newDateString: string | undefined,
  ): boolean {
    if (!newDateString) return false;
    const newDate = this.createDateWithDefaultTime(newDateString);
    return previousDate.getTime() !== newDate.getTime();
  }

  private async handleDateChangeNotification(
    activity: Activity,
    previousFinishDate: Date,
    updateActivityDto: UpdateActivityDto,
  ): Promise<void> {
    if (!this.hasDateChanged(previousFinishDate, updateActivityDto.finishDate))
      return;

    if (activity.isPrivate) return;

    try {
      const [usersToNotify, subjectClass] = await Promise.all([
        this.userSubjectsRepository.getUserIdsBySubjectClassId(
          activity.subjectClassId,
        ),
        this.subjectClassRepository.findByIdWithSubject(
          activity.subjectClassId,
        ),
      ]);

      if (!subjectClass?.subject) {
        this.logger.error({
          message: 'Subject class or subject not found',
          activityId: activity.id,
        });
        return;
      }

      if (!usersToNotify.length) return;

      const newDate = this.createDateWithDefaultTime(
        updateActivityDto.finishDate!,
      );

      await this.notificationQueueService.addNotificationJob({
        title: `Data da Atividade de ${subjectClass.subject.name} Atualizada`,
        message: `A Atividade "${activity.name}" foi atualizada para ${newDate.toLocaleDateString()}.`,
        userIds: usersToNotify,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error handling activity update notification',
        activityId: activity.id,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
