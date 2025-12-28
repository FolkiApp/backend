import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserAbsence } from '../entities/absence.entity';

@Injectable()
export class AbsenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySubject(
    userId: number,
    subjectId: number,
  ): Promise<UserAbsence[]> {
    const absences = await this.prisma.user_absence.findMany({
      where: { userId, userSubjectId: subjectId },
      orderBy: { date: 'desc' },
    });

    return absences.map(
      (a) =>
        new UserAbsence(a.id, a.date, a.createdAt, a.userId, a.userSubjectId),
    );
  }

  async postAbsence(
    userId: number,
    userSubjectId: number,
    date: Date,
  ): Promise<UserAbsence> {
    const [created] = await this.prisma.$transaction([
      this.prisma.user_absence.create({
        data: { userSubjectId, date, userId },
      }),
      this.prisma.user_subject.update({
        where: { id: userSubjectId },
        data: { absences: { increment: 1 } },
      }),
    ]);

    return new UserAbsence(
      created.id,
      created.date,
      created.createdAt,
      created.userId,
      created.userSubjectId,
    );
  }
}
