import { Module } from '@nestjs/common';
import { UniversitiesController } from './universities.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FindAllUniversitiesService } from './services/find-all-universities.service';
import { CreateUniversityService } from './services/create-university.service';
import { UniversityRepository } from './repositories/university.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UniversitiesController],
  providers: [
    FindAllUniversitiesService,
    CreateUniversityService,
    UniversityRepository,
  ],
})
export class UniversitiesModule {}
