import { PrismaModule } from 'src/prisma/prisma.module';
import { ImportanteDateController } from './important-date.controller';
import { FindAllImportantDate } from './services/find-all-important-date.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule],
  controllers: [ImportanteDateController],
  providers: [FindAllImportantDate],
})
export class ImportantDateModule {}
