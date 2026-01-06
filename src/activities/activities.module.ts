import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { GetAllActivitiesService } from './services/get-all-activities.service';
import { CreateActivityService } from './services/create-activity.service';
import { UpdateActivityService } from './services/update-activity.service';
import { DeleteActivityService } from './services/delete-activity.service';
import { CheckActivityService } from './services/check-activity.service';
import { UncheckActivityService } from './services/uncheck-activity.service';
import { IgnoreActivityService } from './services/ignore-activity.service';
import { UnignoreActivityService } from './services/unignore-activity.service';
import { ActivitiesRepository } from './repositories/activities.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [PrismaModule, SubjectsModule],
  controllers: [ActivitiesController],
  providers: [
    GetAllActivitiesService,
    CreateActivityService,
    UpdateActivityService,
    DeleteActivityService,
    CheckActivityService,
    UncheckActivityService,
    IgnoreActivityService,
    UnignoreActivityService,
    ActivitiesRepository,
  ],
  exports: [ActivitiesRepository],
})
export class ActivitiesModule {}
