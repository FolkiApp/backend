import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, subject_class } from '@prisma/client';

@Injectable()
export class SubjectClassRepository {
  constructor(private prisma: PrismaService) {}

  async findBySubjectAndSchedule(
    subjectId: number,
    availableDays: Prisma.InputJsonValue,
    year: number,
    semester: number,
    universityId: number,
  ): Promise<subject_class | null> {
    return this.prisma.subject_class.findFirst({
      where: {
        subjectId,
        availableDays: {
          equals: availableDays,
        },
        year,
        semester,
        universityId,
      },
    });
  }

  async create(
    subjectId: number,
    availableDays: Prisma.InputJsonValue,
    year: number,
    semester: number,
    universityId: number,
    observations: string,
  ): Promise<subject_class> {
    return this.prisma.subject_class.create({
      data: {
        subjectId,
        availableDays,
        year,
        semester,
        universityId,
        observations,
      },
    });
  }

  async updateObservations(
    id: number,
    observations: string,
  ): Promise<subject_class> {
    return this.prisma.subject_class.update({
      where: { id },
      data: { observations },
    });
  }
}
