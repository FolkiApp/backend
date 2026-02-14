import { Injectable } from '@nestjs/common';
import * as OneSignal from 'onesignal-node';
import { CustomLogger } from '../../common/logger/custom-logger.service';

interface SendNotificationDto {
  title: string;
  message: string;
  playerIds: string[];
  idempotencyId?: string;
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
      const { idempotencyId, title, message, playerIds } = dto;
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

      const notification = {
        headings: { en: title },
        contents: { en: message },
        include_player_ids: playerIds,
        external_id: idempotencyId,
      };

      this.logger.log({
        message: `Sending notification to ${playerIds.length} players`,
        idempotencyId,
      });

      await this.client.createNotification(notification);

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
}
