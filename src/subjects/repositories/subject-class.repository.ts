import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SubjectClass } from '../entities/subject-class.entity';
import { AvailableDay } from '../entities/available-days.entity';

@Injectable()
export class SubjectClassRepository {
  constructor(private prisma: PrismaService) {}

  private parseAvailableDays(json: Prisma.JsonValue): AvailableDay[] {
    return json as unknown as AvailableDay[];
  }

  async findLatest(
    universityId: number,
  ): Promise<{ year: number; semester: number } | null> {
    return this.prisma.subject_class.findFirst({
      where: { universityId },
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
    const data = await this.prisma.subject_class.findFirst({
      where: {
        subjectId,
        year,
        semester,
        universityId,
        availableDays: {
          equals: availableDays,
        },
      },
      include: {
        subject: true,
      },
    });

    if (!data) return null;

    return new SubjectClass(
      data.id,
      this.parseAvailableDays(data.availableDays),
      data.subject,
      data.observations ?? undefined,
    );
  }

  async create(
    subjectId: number,
    availableDays: Prisma.InputJsonValue,
    year: number,
    semester: number,
    universityId: number,
    observations: string,
  ): Promise<SubjectClass> {
    const data = await this.prisma.subject_class.create({
      data: {
        subjectId,
        availableDays,
        year,
        semester,
        universityId,
        observations,
      },
      include: {
        subject: true,
      },
    });

    return new SubjectClass(
      data.id,
      this.parseAvailableDays(data.availableDays),
      data.subject,
      data.observations ?? undefined,
    );
  }

  async updateObservations(
    id: number,
    observations: string,
  ): Promise<SubjectClass> {
    const data = await this.prisma.subject_class.update({
      where: { id },
      data: { observations },
      include: {
        subject: true,
      },
    });

    return new SubjectClass(
      data.id,
      this.parseAvailableDays(data.availableDays),
      data.subject,
      data.observations ?? undefined,
    );
  }

  async findByIdAndUserId(
    subjectClassId: number,
    userId: number,
  ): Promise<SubjectClass | null> {
    const data = await this.prisma.subject_class.findFirst({
      where: {
        id: subjectClassId,
        user_subject: {
          some: { userId },
        },
      },
      include: {
        subject: true,
      },
    });

    if (!data) return null;

    return new SubjectClass(
      data.id,
      this.parseAvailableDays(data.availableDays),
      data.subject,
      data.observations ?? undefined,
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
