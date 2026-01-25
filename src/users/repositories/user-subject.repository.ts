import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSubject } from '../entities/user-subject.entity';

@Injectable()
export class UserSubjectRepository {
  constructor(private prisma: PrismaService) {}

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
    });

    return rows.map((us) => ({
      id: us.id,
      userId: us.userId,
      subjectClassId: us.subjectClassId,
      absences: us.absences,
      grading: us.grading,
      createdAt: us.createdAt,
      deletedAt: us.deletedAt,
    }));
  }

  async findManyByUserId(userId: number) {
    return await this.prisma.user_subject.findMany({
      where: { userId },
    });
  }

  async findByUserAndSubjectClass(userId: number, subjectClassId: number) {
    return await this.prisma.user_subject.findFirst({
      where: { userId, subjectClassId },
    });
  }

  async create(userId: number, subjectClassId: number) {
    return await this.prisma.user_subject.create({
      data: { userId, subjectClassId },
    });
  }

  async softDeleteMany(userId: number, subjectClassIds: number[]) {
    return await this.prisma.user_subject.updateMany({
      where: {
        userId,
        subjectClassId: { in: subjectClassIds },
      },
      data: { deletedAt: new Date() },
    });
  }
}
