import { Injectable } from '@nestjs/common';
import * as OneSignal from 'onesignal-node';
import { CustomLogger } from '../../common/logger/custom-logger.service';

interface SendNotificationDto {
  title: string;
  message: string;
  playerIds: string[];
  idempotencyId?: string;
  data?: Record<string, any>;
  webUrl?: string;
  appUrl?: string;
}

@Injectable()
export class PipoNotificationService {
  private readonly logger: CustomLogger;
  private readonly client: OneSignal.Client;

  constructor(logger: CustomLogger) {
    this.logger = logger;
    this.logger.setContext(PipoNotificationService.name);

    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_API_KEY;

    const isConfigured = this.verifyConfiguration();

    if (!isConfigured) {
      this.logger.warn(
        'OneSignal credentials not configured. Notifications will not be sent.',
      );
    }

    this.client = new OneSignal.Client(appId || '', apiKey || '');
  }

  async sendNotification(dto: SendNotificationDto): Promise<void> {
    try {
      const { idempotencyId, title, message, playerIds, data, webUrl, appUrl } =
        dto;
      const isConfigured = this.verifyConfiguration();

      if (!isConfigured) {
        this.logger.warn(
          'OneSignal credentials not configured. Notifications will not be sent.',
        );
        return;
      }

      if (!playerIds || playerIds.length === 0) {
        this.logger.warn({
          message: 'No player IDs provided, skipping notification',
        });
        return;
      }

      const batches = this.chunkArray(playerIds, 900);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchIdempotencyId =
          batches.length > 1 && idempotencyId
            ? `${idempotencyId}-batch-${i}`
            : idempotencyId;

        await this.client.createNotification({
          headings: { en: title },
          contents: { en: message },
          include_player_ids: batch,
          external_id: batchIdempotencyId,
          small_icon: 'notification_icon',
          android_accent_color: '7500BC',
          ...(data ? { data } : {}),
          ...(webUrl ? { web_url: webUrl } : {}),
          ...(appUrl ? { app_url: appUrl } : {}),
        });
      }

      this.logger.log({
        message: `Notification sent successfully to ${playerIds.length} players`,
        idempotencyId,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to send notification',
        error: error instanceof Error ? error.message : String(error),
        dto,
      });
    }
  }

  private verifyConfiguration(): boolean {
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_API_KEY;

    if (!appId || !apiKey) {
      this.logger.warn(
        'OneSignal credentials not configured. Notifications will not be sent.',
      );
      return false;
    }
    return true;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
