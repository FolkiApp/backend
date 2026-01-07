import { Module } from '@nestjs/common';
import { GradesController } from './grades.controller';
import { GetAllGradesFromSubjectService } from './services/get-all-grades-from-subject.service';
import { CreateGradeService } from './services/create-grade.service';
import { DeleteGradeService } from './services/delete-grade.service';
import { GradesRepository } from './repositories/grades.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [PrismaModule, SubjectsModule],
  controllers: [GradesController],
  providers: [
    GetAllGradesFromSubjectService,
    CreateGradeService,
    DeleteGradeService,
    GradesRepository,
  ],
  exports: [GradesRepository],
})
export class GradesModule {}
