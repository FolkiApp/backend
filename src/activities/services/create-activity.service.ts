import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { Activity } from '../entities/activity.entity';
import { InvalidSubjectClassException } from '../exceptions/invalid-subject-class.exception';
import { ActivityAlreadyExistsException } from '../exceptions/activity-already-exists.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityCreateException } from '../exceptions/activity-create.exception';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';
import { getActivityStringDate } from '../../common/utils/date.utils';
import { CustomLogger } from '../../common/logger/custom-logger.service';

@Injectable()
export class CreateActivityService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly subjectClassRepository: SubjectClassRepository,
    private readonly userSubjectsRepository: UserSubjectsRepository,
    private readonly notificationQueueService: NotificationQueueService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(CreateActivityService.name);
  }

  async execute(
    user: AuthUser,
    createActivityDto: CreateActivityDto,
  ): Promise<Activity> {
    this.logger.log({
      message: 'Executing createActivity',
      userId: user.id,
      subjectClassId: createActivityDto.subjectClassId,
    });

    if (user.isBlocked) throw new UserBlockedException();

    await this.verifyIfUserIsRegisteredToSubjectClass(
      createActivityDto.subjectClassId,
      user.id,
    );

    if (!createActivityDto.isPrivate)
      await this.verifyIfActivityAlreadyExists(user.id, createActivityDto);

    const activity = await this.createActivity(user.id, createActivityDto);

    if (!createActivityDto.isPrivate)
      this.sendActivityNotificationAsync(user, createActivityDto, activity);

    this.logger.log({
      message: 'Successfully created activity',
      userId: user.id,
      activityId: activity.id,
    });

    return activity;
  }

  private sendActivityNotificationAsync(
    user: AuthUser,
    createActivityDto: CreateActivityDto,
    activity: Activity,
  ): void {
    void this.sendActivityNotification(user, createActivityDto, activity).catch(
      (error: unknown) => {
        this.logger.error({
          message: 'Failed to send activity notification',
          error: error instanceof Error ? error.message : String(error),
          activityId: activity.id,
        });
      },
    );
  }

  private createDateWithDefaultTime(dateString: string): Date {
    const date = new Date(dateString);
    date.setHours(15, 0, 0, 0);
    return date;
  }

  private async verifyIfUserIsRegisteredToSubjectClass(
    subjectClassId: number,
    userId: number,
  ): Promise<void> {
    let subjectClass;

    try {
      subjectClass = await this.subjectClassRepository.findByIdAndUserId(
        subjectClassId,
        userId,
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error verifying subject class for user',
        userId,
        subjectClassId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityCreateException();
    }

    if (!subjectClass) throw new InvalidSubjectClassException();
  }

  private async verifyIfActivityAlreadyExists(
    userId: number,
    createActivityDto: CreateActivityDto,
  ): Promise<void> {
    let existingActivity: Activity | null;
    try {
      existingActivity =
        await this.activitiesRepository.findActivityByTypeAndDate(
          createActivityDto.subjectClassId,
          createActivityDto.type,
          this.createDateWithDefaultTime(createActivityDto.finishDate),
        );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error verifying existing activity for user',
        userId,
        subjectClassId: createActivityDto.subjectClassId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityCreateException();
    }

    if (existingActivity) {
      throw new ActivityAlreadyExistsException();
    }
  }

  private async createActivity(
    userId: number,
    createActivityDto: CreateActivityDto,
  ): Promise<Activity> {
    try {
      const activity = await this.activitiesRepository.createActivity(
        userId,
        createActivityDto.name,
        createActivityDto.description,
        createActivityDto.value,
        createActivityDto.subjectClassId,
        createActivityDto.type,
        this.createDateWithDefaultTime(createActivityDto.finishDate),
        createActivityDto.isPrivate ?? false,
      );

      return activity;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating activity',
        userId,
        error: error instanceof Error ? error.message : error,
      });

      throw new ActivityCreateException();
    }
  }

  private async sendActivityNotification(
    user: AuthUser,
    createActivityDto: CreateActivityDto,
    activity: Activity,
  ): Promise<void> {
    try {
      const userIds =
        await this.userSubjectsRepository.getUserIdsBySubjectClassId(
          createActivityDto.subjectClassId,
          user.id,
        );

      if (!userIds.length) {
        this.logger.log({
          message: 'No users found for subject class',
          subjectClassId: createActivityDto.subjectClassId,
        });
        return;
      }

      const subjectClass =
        await this.subjectClassRepository.findByIdWithSubject(
          createActivityDto.subjectClassId,
        );

      if (!subjectClass || !subjectClass.subject) {
        this.logger.error({
          message: 'Subject class not found for notification',
          subjectClassId: createActivityDto.subjectClassId,
        });
        return;
      }

      const title = `Nova Atividade de ${subjectClass.subject.name}`;
      const textBody = `A Atividade "${activity.name}" Foi Adicionada para ${getActivityStringDate(
        activity.finishDate.toString(),
      )}.`;

      await this.notificationQueueService.addNotificationJob({
        title,
        message: textBody,
        userIds,
      });

      this.logger.log({
        message: 'Activity notification queued successfully',
        activityId: activity.id,
        recipientsCount: userIds.length,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error queueing activity notification',
        activityId: activity.id,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
