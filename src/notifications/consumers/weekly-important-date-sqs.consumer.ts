import { Injectable } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { NotificationQueueService } from '../services/notification-queue.service';
import { ImportantDateRepository } from '../../important-dates/repositories/important-date.repository';
import type { WeeklyImportantDate } from '../../important-dates/repositories/important-date.repository';

@Injectable()
export class WeeklyImportantDateSqsConsumer {
  private readonly logger: CustomLogger;
  private readonly BATCH_SIZE = 200;
  private readonly DELAY_MS = 1000;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly importantDateRepository: ImportantDateRepository,
    private readonly notificationQueueService: NotificationQueueService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(WeeklyImportantDateSqsConsumer.name);
  }

  @SqsMessageHandler('weekly-important-date-consumer', false)
  async handleMessage(message: Message) {
    try {
      this.logger.log({
        message: 'Processing weekly important date notification from SQS',
        messageId: message.MessageId,
      });

      const { startDate, endDate } = this.calculateWeekDates();

      this.logger.log({
        message: 'Fetching important dates for the week',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const importantDates =
        await this.importantDateRepository.findDayOffBetweenDates(
          startDate,
          endDate,
        );

      if (importantDates.length === 0) {
        this.logger.log({
          message: 'No important dates found for this week',
          messageId: message.MessageId,
        });
        return;
      }

      this.logger.log({
        message: 'Important dates found',
        count: importantDates.length,
        dates: importantDates.map((d) => ({
          name: d.name,
          date: d.date,
          universityId: d.universityId,
        })),
      });

      await this.processAndSendNotifications(importantDates);

      this.logger.log({
        message: 'Weekly important date notifications sent successfully',
        messageId: message.MessageId,
        totalDates: importantDates.length,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to process weekly important date from SQS',
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private calculateWeekDates(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calcular até a próxima sexta-feira
    const currentDay = today.getDay(); // 0 = Domingo, 5 = Sexta
    const daysUntilFriday =
      currentDay <= 5 ? 5 - currentDay : 5 + (7 - currentDay);
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    nextFriday.setHours(23, 59, 59, 999);

    this.logger.log({
      message: 'Week dates calculated',
      today: today.toISOString(),
      nextFriday: nextFriday.toISOString(),
      daysUntilFriday,
      currentDay,
    });

    return {
      startDate: today,
      endDate: nextFriday,
    };
  }

  private async processAndSendNotifications(
    importantDates: WeeklyImportantDate[],
  ): Promise<void> {
    const users = await this.fetchActiveUsersForDates(importantDates);

    if (users.length === 0) {
      this.logger.log({
        message: 'No users to notify',
      });
      return;
    }

    const message = this.buildNotificationMessage(importantDates);

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
        await this.sendNotificationsForBatch(batch, batchNumber, message);
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

  private async fetchActiveUsersForDates(
    importantDates: WeeklyImportantDate[],
  ): Promise<Array<{ id: number; email: string; universityId: number }>> {
    const allUsers = await this.userRepository.findAllActive();

    const relevantUniversityIds = new Set(
      importantDates
        .map((d) => d.universityId)
        .filter((id): id is number => id !== null),
    );

    const filteredUsers = allUsers
      .filter((user) => user.universityId !== null)
      .filter((user) => {
        return relevantUniversityIds.has(user.universityId!);
      }) as Array<{ id: number; email: string; universityId: number }>;

    this.logger.log({
      message: 'Active users filtered',
      totalUsers: allUsers.length,
      relevantUsers: filteredUsers.length,
      relevantUniversityIds: Array.from(relevantUniversityIds),
    });

    return filteredUsers;
  }

  private buildNotificationMessage(
    importantDates: WeeklyImportantDate[],
  ): string {
    if (importantDates.length === 1) {
      const date = importantDates[0];
      const formattedDate = this.formatDate(date.date);
      return `Dia sem aula na semana! ${date.name} (${formattedDate}). Aproveite para descansar! 🎉`;
    }

    return `${importantDates.length} dias sem aula essa semana! Aproveite! 🎉`;
  }

  private formatDate(date: Date): string {
    const weekDays = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const weekDay = weekDays[date.getDay()];
    return `${weekDay}, ${day}/${month}`;
  }

  private async sendNotificationsForBatch(
    batch: Array<{ id: number; email: string; universityId: number }>,
    batchNumber: number,
    message: string,
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
        title: 'Dias sem Aula 📅',
        message,
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
