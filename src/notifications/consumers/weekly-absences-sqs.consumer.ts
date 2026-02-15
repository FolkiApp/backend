import { Injectable } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { NotificationQueueService } from '../services/notification-queue.service';

@Injectable()
export class WeeklyAbsencesSqsConsumer {
  private readonly logger: CustomLogger;
  private readonly BATCH_SIZE = 200;
  private readonly DELAY_MS = 1000;
  private readonly UNIVERSITY_SEMESTER_DATES: Record<number, [Date, Date]> = {
    1: [new Date(2026, 2, 23), new Date(2026, 7, 4)], // USP
    2: [new Date(2026, 3, 9), new Date(2026, 7, 18)], // UFSCar
  };

  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationQueueService: NotificationQueueService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(WeeklyAbsencesSqsConsumer.name);
  }

  @SqsMessageHandler('weekly-absences-consumer', false)
  async handleMessage(message: Message) {
    try {
      this.logger.log({
        message: 'Processing weekly absences notification from SQS',
        messageId: message.MessageId,
      });

      const users = await this.fetchAllActiveUsers();

      if (users.length === 0) {
        this.logger.log({
          message: 'No active users found',
          messageId: message.MessageId,
        });
        return;
      }

      this.logger.log({
        message: 'Active users fetched',
        totalUsers: users.length,
      });

      await this.processAndSendNotifications(users);

      this.logger.log({
        message: 'Weekly absences notifications sent successfully',
        messageId: message.MessageId,
        totalNotifications: users.length,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to process weekly absences from SQS',
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async fetchAllActiveUsers(): Promise<
    Array<{ id: number; email: string; universityId: number }>
  > {
    this.logger.log({
      message: 'Fetching all active users from database',
    });

    const allUsers = await this.userRepository.findAllActive();

    const usersWithoutUniversity = allUsers.filter(
      (user) => user.universityId === null,
    );

    const usersWithActiveSemester = allUsers
      .filter((user) => user.universityId !== null)
      .filter((user) => this.isSemesterActive(user.universityId!)) as Array<{
      id: number;
      email: string;
      universityId: number;
    }>;

    if (usersWithoutUniversity.length > 0) {
      this.logger.warn({
        message: 'Users without university found, skipping',
        count: usersWithoutUniversity.length,
        userIds: usersWithoutUniversity.map((u) => u.id),
      });
    }

    this.logger.log({
      message: 'Active users fetched and filtered by semester',
      totalUsers: allUsers.length,
      usersWithoutUniversity: usersWithoutUniversity.length,
      usersWithActiveSemester: usersWithActiveSemester.length,
      filteredOut: allUsers.length - usersWithActiveSemester.length,
    });

    return usersWithActiveSemester;
  }

  private async processAndSendNotifications(
    users: Array<{ id: number; email: string; universityId: number }>,
  ): Promise<void> {
    this.logger.log({
      message: 'Starting batch processing',
      totalUsers: users.length,
      batchSize: this.BATCH_SIZE,
      estimatedBatches: Math.ceil(users.length / this.BATCH_SIZE),
    });

    for (let i = 0; i < users.length; i += this.BATCH_SIZE) {
      const batch = users.slice(i, i + this.BATCH_SIZE);
      const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

      this.logger.log({
        message: 'Processing batch',
        batchNumber,
        batchSize: batch.length,
        totalBatches: Math.ceil(users.length / this.BATCH_SIZE),
      });

      try {
        await this.sendNotificationsForBatch(batch, batchNumber);
      } catch (error: unknown) {
        this.logger.error({
          message: 'Error processing batch, continuing with next batch',
          batchNumber,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (i + this.BATCH_SIZE < users.length) {
        this.logger.log({
          message: 'Waiting before next batch',
          delayMs: this.DELAY_MS,
        });
        await this.delay(this.DELAY_MS);
      }
    }
  }

  private async sendNotificationsForBatch(
    batch: Array<{ id: number; email: string; universityId: number }>,
    batchNumber: number,
  ): Promise<void> {
    const userIds = batch.map((user) => user.id);

    this.logger.log({
      message: 'Sending notification for batch',
      batchNumber,
      userIds,
      userIdsCount: userIds.length,
    });

    try {
      await this.notificationQueueService.addNotificationJob({
        title: 'Não esqueça!',
        message:
          'A semana acabou! Não esqueça de marcar as suas faltas da semana no Folki!',
        userIds,
      });

      this.logger.log({
        message: 'Batch notification sent successfully',
        batchNumber,
        recipientsCount: userIds.length,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to send notification for batch',
        batchNumber,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private isSemesterActive(universityId: number): boolean {
    const semesterDates = this.UNIVERSITY_SEMESTER_DATES[universityId];

    if (!semesterDates) {
      this.logger.warn({
        message: 'University semester dates not configured, skipping user',
        universityId,
      });
      return false;
    }

    const now = new Date();
    const [startDate, endDate] = semesterDates;

    const isActive = now >= startDate && now <= endDate;

    this.logger.debug({
      message: 'Checking semester status',
      universityId,
      currentDate: now.toISOString(),
      semesterStart: startDate.toISOString(),
      semesterEnd: endDate.toISOString(),
      isActive,
    });

    return isActive;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
