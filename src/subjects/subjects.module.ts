import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubjectRepository } from './repositories/subject.repository';
import { SubjectClassRepository } from './repositories/subject-class.repository';

@Module({
  imports: [PrismaModule],
  providers: [SubjectRepository, SubjectClassRepository],
  exports: [SubjectRepository, SubjectClassRepository],
})
export class SubjectsModule {}
