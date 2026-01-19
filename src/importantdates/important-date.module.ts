import { PrismaModule } from 'src/prisma/prisma.module';
import { ImportantDateController } from './important-date.controller';
import { FindAllImportantDateService } from './services/find-all-important-date.service';
import { Module } from '@nestjs/common';
import { InstituteRepository } from '../institutes/repositories/institute.repository';
import { ImportantDateRepository } from './repositories/important-date.repository';
import { CreateImportantDateService } from './services/create-important-date.service';

@Module({
  imports: [PrismaModule],
  controllers: [ImportantDateController],
  providers: [
    FindAllImportantDateService,
    CreateImportantDateService,
    ImportantDateRepository,
    InstituteRepository,
  ],
})
export class ImportantDateModule {}
