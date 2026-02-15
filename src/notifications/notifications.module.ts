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
import { ImportantDatesModule } from '../important-dates/important-dates.module';

@Module({
  imports: [
    SubjectsModule,
    forwardRef(() => ActivitiesModule),
    UsersModule,
    ImportantDatesModule,
  ],
  controllers: [NotificationsController],
  providers: [
    PipoNotificationService,
    NotificationQueueService,
    NotificationSqsConsumer,
    WeeklyActivitiesSqsConsumer,
    WeeklyAbsencesSqsConsumer,
    WeeklyImportantDateSqsConsumer,
  ],
  exports: [PipoNotificationService, NotificationQueueService],
})
export class NotificationsModule {}
