import { Injectable } from '@nestjs/common';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { EmailSendException } from '../exceptions/email-send.exception';
import { UserRepository } from '../../users/repositories/user.repository';
import { SendEmailDto } from '../dto/send-email.dto';

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger: CustomLogger;
  private readonly sesClient: SESv2Client;
  private readonly fromEmail: string;

  constructor(
    logger: CustomLogger,
    private readonly userRepository: UserRepository,
  ) {
    this.logger = logger;
    this.logger.setContext(EmailService.name);

    this.sesClient = new SESv2Client({
      region: process.env.AWS_REGION,
    });
    this.fromEmail = process.env.AWS_SES_FROM_EMAIL || '';

    if (!this.verifyConfiguration()) {
      this.logger.warn(
        'AWS SES sender (AWS_SES_FROM_EMAIL) not configured. Emails will not be sent.',
      );
    }
  }

  async sendEmail(params: SendEmailParams): Promise<void> {
    const { to, subject, html, text, replyTo } = params;

    if (!this.verifyConfiguration()) {
      this.logger.warn({
        message: 'AWS SES sender not configured. Skipping email.',
        subject,
      });
      return;
    }

    if (!to || to.length === 0) {
      this.logger.warn({
        message: 'No recipients provided, skipping email',
        subject,
      });
      return;
    }

    try {
      await this.sesClient.send(
        new SendEmailCommand({
          FromEmailAddress: this.fromEmail,
          Destination: { ToAddresses: to },
          ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: 'UTF-8' },
              Body: {
                Html: { Data: html, Charset: 'UTF-8' },
                ...(text ? { Text: { Data: text, Charset: 'UTF-8' } } : {}),
              },
            },
          },
        }),
      );

      this.logger.log({
        message: `Email sent successfully to ${to.length} recipient(s)`,
        subject,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to send email',
        subject,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new EmailSendException();
    }
  }

  /**
   * Resolves recipient emails from user IDs and sends the email.
   * Returns the resolved recipients; when none are found, nothing is sent
   * and an empty array is returned so callers can log the appropriate context.
   */
  async sendEmailToUserIds(data: SendEmailDto): Promise<string[]> {
    const to = await this.userRepository.findEmailsByIds(data.userIds);

    if (!to.length) {
      return [];
    }

    await this.sendEmail({
      to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo,
    });

    return to;
  }

  private verifyConfiguration(): boolean {
    return Boolean(this.fromEmail);
  }
}
