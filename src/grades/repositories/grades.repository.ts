import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Grade } from '../entities/grade.entity';

interface CreateGradeData {
  userSubjectId: number;
  name: string;
  percentage: number;
  value: number;
}

@Injectable()
export class GradesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(gradeId: number): Promise<Grade | null> {
    return await this.prisma.grade.findUnique({
      where: { id: gradeId },
    });
  }

  async findAllByUserSubject(userSubjectId: number): Promise<Grade[]> {
    return await this.prisma.grade.findMany({
      where: {
        userSubjectId,
      },
    });
  }

  async create(data: CreateGradeData): Promise<Grade> {
    const gradeValue = data.value * (data.percentage / 100);

    return await this.prisma.$transaction(async (tx) => {
      const grade = await tx.grade.create({
        data: {
          userSubjectId: data.userSubjectId,
          name: data.name,
          percentage: data.percentage,
          value: data.value,
        },
      });

      await tx.user_subject.update({
        where: { id: data.userSubjectId },
        data: { grading: { increment: gradeValue } },
      });

      return grade;
    });
  }

  async delete(gradeId: number): Promise<void> {
    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!grade) return;

    const gradeValue = grade.value * (grade.percentage / 100);

    await this.prisma.$transaction(async (tx) => {
      await tx.grade.delete({
        where: { id: gradeId },
      });

      await tx.user_subject.update({
        where: { id: grade.userSubjectId },
        data: { grading: { decrement: gradeValue } },
      });
    });
  }
}
