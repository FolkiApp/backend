import { Injectable, Optional } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { v4 as uuidv4 } from 'uuid';
import { SendEmailDto } from '../dto/send-email.dto';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { EmailService } from './email.service';

const DELAY_SECONDS = 0;

@Injectable()
export class EmailQueueService {
  private readonly logger: CustomLogger;
  private readonly queueUrl: string;
  private readonly useSqs: boolean;

  constructor(
    @Optional() private readonly sqsService: SqsService,
    private readonly emailService: EmailService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(EmailQueueService.name);
    this.queueUrl = process.env.AWS_SQS_EMAIL_QUEUE_URL || '';
    this.useSqs = !!this.queueUrl && !!this.sqsService;

    if (!this.useSqs) {
      this.logger.warn({
        message: 'SQS not configured, emails will be sent synchronously',
      });
    }
  }

  async addEmailJob(data: SendEmailDto): Promise<void> {
    const idempotencyId = data.idempotencyId || uuidv4();
    const messageBody = { ...data, idempotencyId };

    if (!this.useSqs) {
      try {
        const recipients =
          await this.emailService.sendEmailToUserIds(messageBody);

        if (!recipients.length) {
          this.logger.warn({
            message: 'No emails found for users (synchronous)',
            idempotencyId,
            userIdsCount: data.userIds.length,
          });
          return;
        }

        this.logger.log({
          message: 'Email sent synchronously (SQS not configured)',
          idempotencyId,
          recipientsCount: recipients.length,
        });
      } catch (error) {
        this.logger.error({
          message: 'Failed to send email synchronously',
          idempotencyId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
      return;
    }

    try {
      await this.sqsService.send('email', {
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
        message: 'Email sent to SQS',
        idempotencyId,
        userIdsCount: data.userIds.length,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to send email to SQS',
        idempotencyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
