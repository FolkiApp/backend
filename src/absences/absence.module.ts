import { PrismaModule } from '../prisma/prisma.module';
import { AbsenceController } from './absence.controller';
import { Module } from '@nestjs/common';
import { AbsenceBySubjectService } from './services/find-absence-by-subject.service';
import { AbsenceRepository } from './repositories/absence.repository';
import { SubjectRepository } from '../subjects/repositories/subject.repository';
import { PostAbsence } from './services/post-absence.service';
import { UserSubjectRepository } from '../users/repositories/user-subject.repository';
import { DeleteAbsence } from './services/delete-absence.service';

@Module({
  imports: [PrismaModule],
  controllers: [AbsenceController],
  providers: [
    AbsenceBySubjectService,
    AbsenceRepository,
    SubjectRepository,
    PostAbsence,
    UserSubjectRepository,
    DeleteAbsence,
  ],
})
export class AbsenceModule {}
