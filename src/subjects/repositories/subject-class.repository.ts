import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SubjectClass } from '../entities/subject-class.entity';

@Injectable()
export class SubjectClassRepository {
  constructor(private prisma: PrismaService) {}

  async findLatest(): Promise<{ year: number; semester: number } | null> {
    return this.prisma.subject_class.findFirst({
      orderBy: [{ year: 'desc' }, { semester: 'desc' }],
      select: {
        year: true,
        semester: true,
      },
    });
  }

  async findBySubjectAndSchedule(
    subjectId: number,
    availableDays: Prisma.InputJsonValue,
    year: number,
    semester: number,
    universityId: number,
  ): Promise<SubjectClass | null> {
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
  ): Promise<SubjectClass> {
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
  ): Promise<SubjectClass> {
    return this.prisma.subject_class.update({
      where: { id },
      data: { observations },
    });
  }

  async findByIdAndUserId(
    subjectClassId: number,
    userId: number,
  ): Promise<SubjectClass | null> {
    const subjectClass = await this.prisma.subject_class.findFirst({
      where: {
        id: subjectClassId,
        user_subject: { some: { userId } },
      },
    });

    if (!subjectClass) return null;

    return new SubjectClass(
      subjectClass.id,
      subjectClass.subjectId,
      subjectClass.availableDays,
      subjectClass.year,
      subjectClass.semester,
      subjectClass.universityId,
      subjectClass.observations,
    );
  }

  async findByIdWithSubject(
    subjectClassId: number,
  ): Promise<{ id: number; subject: { name: string } } | null> {
    return this.prisma.subject_class.findUnique({
      where: { id: subjectClassId },
      select: {
        id: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}
