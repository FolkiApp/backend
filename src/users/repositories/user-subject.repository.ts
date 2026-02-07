import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSubject } from '../entities/user-subject.entity';
import { AvailableDay } from 'src/subjects/entities/available-days.entity';

@Injectable()
export class UserSubjectRepository {
  constructor(private prisma: PrismaService) {}

  private parseAvailableDays(value: unknown): AvailableDay[] {
    if (!Array.isArray(value)) return [];

    return value.filter(
      (v): v is AvailableDay =>
        typeof v === 'object' &&
        v !== null &&
        'day' in v &&
        'start' in v &&
        'end' in v,
    );
  }

  async findByUserAndClass(
    userId: number,
    year: number,
    semester: number,
  ): Promise<UserSubject[]> {
    const rows = await this.prisma.user_subject.findMany({
      where: {
        userId,
        deletedAt: null,
        subjectClass: { year, semester },
      },
      include: {
        subjectClass: {
          include: {
            subject: true,
          },
        },
      },
    });

    return rows.map((us) => ({
      id: us.id,
      absences: us.absences,
      grading: us.grading,
      subjectClass: {
        id: us.subjectClass.id,
        availableDays: this.parseAvailableDays(us.subjectClass.availableDays),
        subject: us.subjectClass.subject,
        observations: us.subjectClass.observations ?? undefined,
      },
    }));
  }

  async findManyByUserId(userId: number) {
    return this.prisma.user_subject.findMany({
      where: { userId },
    });
  }

  async findByUserAndSubjectClass(userId: number, subjectClassId: number) {
    return this.prisma.user_subject.findFirst({
      where: { userId, subjectClassId },
    });
  }

  async create(userId: number, subjectClassId: number) {
    return this.prisma.user_subject.create({
      data: { userId, subjectClassId },
    });
  }

  async softDeleteMany(userId: number, subjectClassIds: number[]) {
    return this.prisma.user_subject.updateMany({
      where: {
        userId,
        subjectClassId: { in: subjectClassIds },
      },
      data: { deletedAt: new Date() },
    });
  }
}
