import { Injectable, Optional } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { v4 as uuidv4 } from 'uuid';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { PipoNotificationService } from './pipo-notification.service';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { NotificationRepository } from '../repositories/notification.repository';

const DELAY_SECONDS = 0;

@Injectable()
export class NotificationQueueService {
  private readonly logger: CustomLogger;
  private readonly queueUrl: string;
  private readonly useSqs: boolean;

  constructor(
    @Optional() private readonly sqsService: SqsService,
    private readonly pipoNotificationService: PipoNotificationService,
    private readonly userSubjectsRepository: UserSubjectsRepository,
    private readonly notificationRepository: NotificationRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(NotificationQueueService.name);
    this.queueUrl = process.env.AWS_SQS_NOTIFICATION_QUEUE_URL || '';
    this.useSqs = !!this.queueUrl && !!this.sqsService;

    if (!this.useSqs) {
      this.logger.warn({
        message: 'SQS not configured, notifications will be sent synchronously',
      });
    }
  }

  async addNotificationJob(data: SendNotificationDto): Promise<void> {
    const idempotencyId = data.idempotencyId || uuidv4();
    const messageBody = { ...data, idempotencyId };

    try {
      this.logger.log({
        message: 'Saving notification to database',
        userIdsCount: data.userIds.length,
      });
      await this.notificationRepository.createNotification(
        data.title,
        data.message,
        data.userIds,
      );
    } catch (dbError) {
      this.logger.error({
        message: 'Failed to save notification to database',
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    if (!this.useSqs) {
      try {
        const playerIds =
          await this.userSubjectsRepository.getNotificationIdsByUserIds(
            data.userIds,
          );

        if (!playerIds.length) {
          this.logger.warn({
            message: 'No notification IDs found for users (synchronous)',
            idempotencyId,
            userIdsCount: data.userIds.length,
          });
          return;
        }

        await this.pipoNotificationService.sendNotification({
          title: messageBody.title,
          message: messageBody.message,
          playerIds,
          idempotencyId,
        });

        this.logger.log({
          message: 'Notification sent synchronously (SQS not configured)',
          idempotencyId,
          recipientsCount: playerIds.length,
        });
      } catch (error) {
        this.logger.error({
          message: 'Failed to send notification synchronously',
          idempotencyId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
      return;
    }

    try {
      await this.sqsService.send('notifications', {
        id: idempotencyId,
        body: messageBody,
        delaySeconds: DELAY_SECONDS,
        messageAttributes: {
          idempotencyId: {
            DataType: 'String',
            StringValue: idempotencyId,
          },
        },
      });

      this.logger.log({
        message: 'Notification sent to SQS',
        idempotencyId,
        userIdsCount: data.userIds.length,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to send notification to SQS',
        idempotencyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
