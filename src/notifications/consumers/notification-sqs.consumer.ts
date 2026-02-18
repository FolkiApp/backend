import { Injectable } from '@nestjs/common';
import { SqsMessageHandler, SqsConsumerEventHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { PipoNotificationService } from '../services/pipo-notification.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';

@Injectable()
export class NotificationSqsConsumer {
  private readonly logger: CustomLogger;

  constructor(
    private readonly pipoNotificationService: PipoNotificationService,
    private readonly userSubjectsRepository: UserSubjectsRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(NotificationSqsConsumer.name);
  }

  @SqsMessageHandler('notifications-consumer', false)
  async handleMessage(message: Message) {
    try {
      const body = JSON.parse(message.Body || '{}') as SendNotificationDto;

      this.logger.log({
        message: 'Processing notification from SQS',
        messageId: message.MessageId,
        idempotencyId: body.idempotencyId,
        userIdsCount: body.userIds.length,
      });

      const playerIds =
        await this.userSubjectsRepository.getNotificationIdsByUserIds(
          body.userIds,
        );

      if (!playerIds.length) {
        this.logger.warn({
          message: 'No notification IDs found for users',
          messageId: message.MessageId,
          idempotencyId: body.idempotencyId,
          userIdsCount: body.userIds.length,
        });
        return;
      }

      await this.pipoNotificationService.sendNotification({
        title: body.title,
        message: body.message,
        playerIds,
        idempotencyId: body.idempotencyId,
        data: body.data,
        webUrl: body.webUrl,
        appUrl: body.appUrl,
      });

      this.logger.log({
        message: 'Notification processed successfully from SQS',
        messageId: message.MessageId,
        idempotencyId: body.idempotencyId,
        recipientsCount: playerIds.length,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to process notification from SQS',
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @SqsConsumerEventHandler('notifications-consumer', 'error')
  onError(error: Error) {
    this.logger.error({
      message: 'SQS consumer error',
      error: error.message,
    });
  }

  @SqsConsumerEventHandler('notifications-consumer', 'processing_error')
  onProcessingError(error: Error, message: Message) {
    this.logger.error({
      message: 'SQS message processing error',
      messageId: message.MessageId,
      error: error.message,
    });
  }
}
