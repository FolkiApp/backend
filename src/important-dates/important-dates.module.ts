import { Module } from '@nestjs/common';
import { ImportantDateRepository } from './repositories/important-date.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ImportantDateRepository],
  exports: [ImportantDateRepository],
})
export class ImportantDatesModule {}
