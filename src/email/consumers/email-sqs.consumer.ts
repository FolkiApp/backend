import { Injectable } from '@nestjs/common';
import { SqsMessageHandler, SqsConsumerEventHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { EmailService } from '../services/email.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SendEmailDto } from '../dto/send-email.dto';

@Injectable()
export class EmailSqsConsumer {
  private readonly logger: CustomLogger;

  constructor(
    private readonly emailService: EmailService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(EmailSqsConsumer.name);
  }

  @SqsMessageHandler('email-consumer', false)
  async handleMessage(message: Message) {
    try {
      const body = JSON.parse(message.Body || '{}') as SendEmailDto;

      this.logger.log({
        message: 'Processing email from SQS',
        messageId: message.MessageId,
        idempotencyId: body.idempotencyId,
        userIdsCount: body.userIds.length,
      });

      const recipients = await this.emailService.sendEmailToUserIds(
        body.userIds,
        {
          subject: body.subject,
          html: body.html,
          text: body.text,
          replyTo: body.replyTo,
        },
      );

      if (!recipients.length) {
        this.logger.warn({
          message: 'No emails found for users',
          messageId: message.MessageId,
          idempotencyId: body.idempotencyId,
          userIdsCount: body.userIds.length,
        });
        return;
      }

      this.logger.log({
        message: 'Email processed successfully from SQS',
        messageId: message.MessageId,
        idempotencyId: body.idempotencyId,
        recipientsCount: recipients.length,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to process email from SQS',
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @SqsConsumerEventHandler('email-consumer', 'error')
  onError(error: Error) {
    this.logger.error({
      message: 'SQS consumer error',
      error: error.message,
    });
  }

  @SqsConsumerEventHandler('email-consumer', 'processing_error')
  onProcessingError(error: Error, message: Message) {
    this.logger.error({
      message: 'SQS message processing error',
      messageId: message.MessageId,
      error: error.message,
    });
  }
}
