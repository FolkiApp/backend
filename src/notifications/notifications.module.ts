import { Module, forwardRef } from '@nestjs/common';
import { PipoNotificationService } from './services/pipo-notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { NotificationSqsConsumer } from './consumers/notification-sqs.consumer';
import { WeeklyActivitiesSqsConsumer } from './consumers/weekly-activities-sqs.consumer';
import { WeeklyAbsencesSqsConsumer } from './consumers/weekly-absences-sqs.consumer';
import { WeeklyImportantDateSqsConsumer } from './consumers/weekly-important-date-sqs.consumer';
import { NotificationsController } from './notifications.controller';
import { SubjectsModule } from '../subjects/subjects.module';
import { ActivitiesModule } from '../activities/activities.module';
import { UsersModule } from '../users/users.module';
import { ImportantDateModule } from '../importantdates/important-date.module';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [
    SubjectsModule,
    forwardRef(() => ActivitiesModule),
    UsersModule,
    ImportantDateModule,
  ],
  controllers: [NotificationsController],
  providers: [
    PipoNotificationService,
    NotificationQueueService,
    NotificationSqsConsumer,
    WeeklyActivitiesSqsConsumer,
    WeeklyAbsencesSqsConsumer,
    WeeklyImportantDateSqsConsumer,
    NotificationRepository,
  ],
  exports: [PipoNotificationService, NotificationQueueService],
})
export class NotificationsModule {}
