import { PrismaModule } from 'src/prisma/prisma.module';
import { AbsenceController } from './absence.controller';
import { Module } from '@nestjs/common';
import { AbsenceBySubjectService } from './services/find-absence-by-subject.service';
import { AbsenceRepository } from './repositories/absence.repository';
import { SubjectRepository } from 'src/subjects/repositories/subject.repository';
import { PostAbsence } from './services/post-absence.service';
import { UserSubjectRepository } from 'src/users/repositories/user-subject.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AbsenceController],
  providers: [
    AbsenceBySubjectService,
    AbsenceRepository,
    SubjectRepository,
    PostAbsence,
    UserSubjectRepository,
  ],
})
export class AbsenceModule {}
