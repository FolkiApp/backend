import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { NotificationQueueService } from './services/notification-queue.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CustomLogger } from '../common/logger/custom-logger.service';

@Controller('notifications')
@UseGuards(ApiKeyGuard)
export class NotificationsController {
  private readonly logger: CustomLogger;

  constructor(
    private readonly notificationQueueService: NotificationQueueService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(NotificationsController.name);
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendNotification(@Body() dto: SendNotificationDto): Promise<void> {
    this.logger.log({
      message: 'Sending notification',
      userIdsCount: dto.userIds.length,
    });

    await this.notificationQueueService.addNotificationJob(dto);
  }
}
