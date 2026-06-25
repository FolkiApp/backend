import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './services/email.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
