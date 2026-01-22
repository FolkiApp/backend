import { Injectable, Logger } from '@nestjs/common';
import * as OneSignal from 'onesignal-node';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Injectable()
export class PipoNotificationService {
  private readonly logger = new Logger(PipoNotificationService.name);
  private readonly client: OneSignal.Client;

  constructor() {
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
      const { title, message, playerIds } = dto;
      const isConfigured = this.verifyConfiguration();

      if (!isConfigured) {
        this.logger.warn(
          'OneSignal credentials not configured. Notifications will not be sent.',
        );
        return;
      }

      if (!playerIds || playerIds.length === 0) {
        this.logger.warn('No player IDs provided, skipping notification');
        return;
      }

      const notification = {
        headings: { en: title },
        contents: { en: message },
        include_player_ids: playerIds,
      };

      this.logger.log(`Sending notification to ${playerIds.length} players`);

      const response = await this.client.createNotification(notification);

      this.logger.log(
        `Notification sent successfully to ${playerIds.length} players`,
        response.body,
      );
    } catch (error) {
      this.logger.error('Failed to send notification', {
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
