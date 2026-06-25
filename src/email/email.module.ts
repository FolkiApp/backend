import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './services/email.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailSqsConsumer } from './consumers/email-sqs.consumer';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [EmailController],
  providers: [EmailService, EmailQueueService, EmailSqsConsumer],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}
