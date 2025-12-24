import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CourseRepository } from './repositories/course.repository';

@Module({
  imports: [PrismaModule],
  providers: [CourseRepository],
  exports: [CourseRepository],
})
export class CoursesModule {}
