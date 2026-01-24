import { Module } from '@nestjs/common';
import { PipoNotificationService } from './services/pipo-notification.service';

@Module({
  providers: [PipoNotificationService],
  exports: [PipoNotificationService],
})
export class NotificationsModule {}
