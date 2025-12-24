import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserSubjectRepository {
  constructor(private prisma: PrismaService) {}

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
