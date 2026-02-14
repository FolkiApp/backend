import { Module, forwardRef } from '@nestjs/common';
import { PipoNotificationService } from './services/pipo-notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { NotificationSqsConsumer } from './consumers/notification-sqs.consumer';
import { WeeklyActivitiesSqsConsumer } from './consumers/weekly-activities-sqs.consumer';
import { NotificationsController } from './notifications.controller';
import { SubjectsModule } from '../subjects/subjects.module';
import { ActivitiesModule } from '../activities/activities.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SubjectsModule, forwardRef(() => ActivitiesModule), UsersModule],
  controllers: [NotificationsController],
  providers: [
    PipoNotificationService,
    NotificationQueueService,
    NotificationSqsConsumer,
    WeeklyActivitiesSqsConsumer,
  ],
  exports: [PipoNotificationService, NotificationQueueService],
})
export class NotificationsModule {}
