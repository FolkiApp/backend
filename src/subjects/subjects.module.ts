import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubjectRepository } from './repositories/subject.repository';
import { SubjectClassRepository } from './repositories/subject-class.repository';
import { UserSubjectsRepository } from './repositories/user-subjects.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    SubjectRepository,
    SubjectClassRepository,
    UserSubjectsRepository,
  ],
  exports: [SubjectRepository, SubjectClassRepository, UserSubjectsRepository],
})
export class SubjectsModule {}
