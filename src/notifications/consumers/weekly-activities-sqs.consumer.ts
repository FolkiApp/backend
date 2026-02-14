import { Injectable } from '@nestjs/common';
import { SqsMessageHandler, SqsConsumerEventHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { ActivitiesRepository } from '../../activities/repositories/activities.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { NotificationQueueService } from '../services/notification-queue.service';
import { WeeklyActivitiesSummary } from '../../activities/repositories/dto/weekly-activities-summary.dto';

@Injectable()
export class WeeklyActivitiesSqsConsumer {
  private readonly logger: CustomLogger;
  private readonly BATCH_SIZE = 200;
  private readonly DELAY_MS = 1000;

  constructor(
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationQueueService: NotificationQueueService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(WeeklyActivitiesSqsConsumer.name);
  }

  @SqsMessageHandler('weekly-activities-consumer', false)
  async handleMessage(message: Message) {
    try {
      this.logger.log({
        message: 'Processing weekly activities notification from SQS',
        messageId: message.MessageId,
      });

      const { startDate, endDate } = this.calculateWeekDates();

      this.logger.log({
        message: 'Fetching weekly activities',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const summaries = await this.fetchWeeklyActivitiesSummary(
        startDate,
        endDate,
      );

      if (summaries.length === 0) {
        this.logger.log({
          message: 'No activities found for this week',
          messageId: message.MessageId,
        });
        return;
      }

      this.logger.log({
        message: 'Weekly activities summary fetched',
        usersWithActivities: summaries.length,
      });

      await this.processAndSendNotifications(summaries);

      this.logger.log({
        message: 'Weekly activities notifications sent successfully',
        messageId: message.MessageId,
        totalNotifications: summaries.filter((s) => s.totalActivities > 0)
          .length,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to process weekly activities from SQS',
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private calculateWeekDates(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    nextSunday.setHours(23, 59, 59, 999);

    this.logger.log({
      message: 'Week dates calculated',
      today: today.toISOString(),
      nextSunday: nextSunday.toISOString(),
      daysUntilSunday,
    });

    return {
      startDate: today,
      endDate: nextSunday,
    };
  }

  private async fetchWeeklyActivitiesSummary(
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyActivitiesSummary[]> {
    this.logger.log({
      message: 'Fetching weekly activities summary from database',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const summaries =
      await this.activitiesRepository.getWeeklyActivitiesSummary(
        startDate,
        endDate,
      );

    this.logger.log({
      message: 'Weekly activities summary fetched successfully',
      summariesCount: summaries.length,
    });

    return summaries;
  }

  private async processAndSendNotifications(
    summaries: WeeklyActivitiesSummary[],
  ): Promise<void> {
    this.logger.log({
      message: 'Starting batch processing',
      totalSummaries: summaries.length,
      batchSize: this.BATCH_SIZE,
      estimatedBatches: Math.ceil(summaries.length / this.BATCH_SIZE),
    });

    for (let i = 0; i < summaries.length; i += this.BATCH_SIZE) {
      const batch: WeeklyActivitiesSummary[] = summaries.slice(
        i,
        i + this.BATCH_SIZE,
      );
      const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

      this.logger.log({
        message: 'Processing batch',
        batchNumber,
        batchSize: batch.length,
        totalBatches: Math.ceil(summaries.length / this.BATCH_SIZE),
      });

      try {
        await this.sendNotificationsForBatch(batch, batchNumber);
      } catch (error: unknown) {
        this.logger.error({
          message: 'Failed to process batch, continuing with next batch',
          batchNumber,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (i + this.BATCH_SIZE < summaries.length) {
        this.logger.log({
          message: 'Waiting before next batch',
          delayMs: this.DELAY_MS,
        });
        await this.delay(this.DELAY_MS);
      }
    }

    this.logger.log({
      message: 'Batch processing completed',
      totalSummaries: summaries.length,
    });
  }

  private async sendNotificationsForBatch(
    batch: WeeklyActivitiesSummary[],
    batchNumber: number,
  ): Promise<void> {
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const summary of batch) {
      if (summary.totalActivities === 0) {
        skipCount++;
        continue;
      }

      try {
        const notificationMessage = this.buildNotificationMessage(summary);

        await this.notificationQueueService.addNotificationJob({
          title: 'Resumo Semanal - Folki',
          message: notificationMessage,
          userIds: [summary.userId],
        });

        successCount++;

        this.logger.log({
          message: 'Notification queued successfully',
          userId: summary.userId,
          totalActivities: summary.totalActivities,
          completedActivities: summary.completedActivities,
          batchNumber,
        });
      } catch (error: unknown) {
        failCount++;
        this.logger.error({
          message: 'Failed to queue notification for user',
          userId: summary.userId,
          batchNumber,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continua processando próximo usuário mesmo se este falhar
      }
    }

    this.logger.log({
      message: 'Batch processing summary',
      batchNumber,
      totalUsers: batch.length,
      successCount,
      skipCount,
      failCount,
    });
  }

  private buildNotificationMessage(summary: WeeklyActivitiesSummary): string {
    if (summary.completedActivities === 0) {
      return `Essa semana você tem ${summary.totalActivities} ${
        summary.totalActivities === 1
          ? 'tarefa cadastrada'
          : 'tarefas cadastradas'
      } no Folki. Não esqueça de marcá-las como feitas! 📚`;
    }

    if (summary.completedActivities === summary.totalActivities) {
      return `Parabéns! Você já concluiu todas as ${summary.totalActivities} ${
        summary.totalActivities === 1 ? 'tarefa' : 'tarefas'
      } da semana no Folki! 🎉`;
    }

    return `Essa semana você tem ${summary.totalActivities} ${
      summary.totalActivities === 1
        ? 'tarefa cadastrada'
        : 'tarefas cadastradas'
    } no Folki. Você já marcou ${summary.completedActivities} como ${
      summary.completedActivities === 1 ? 'feita' : 'feitas'
    }! 📝✅`;
  }

  @SqsConsumerEventHandler('weekly-activities-consumer', 'error')
  onError(error: Error) {
    this.logger.error({
      message: 'SQS consumer error (weekly activities)',
      error: error.message,
    });
  }

  @SqsConsumerEventHandler('weekly-activities-consumer', 'processing_error')
  onProcessingError(error: Error, message: Message) {
    this.logger.error({
      message: 'SQS message processing error (weekly activities)',
      messageId: message.MessageId,
      error: error.message,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
