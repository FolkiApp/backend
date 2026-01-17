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

  async findAbsenceById(
    userId: number,
    absenceId: number,
  ): Promise<UserAbsence | null> {
    const absence = await this.prisma.user_absence.findFirst({
      where: { id: absenceId },
    });

    if (!absence) return null;

    return new UserAbsence(
      absence.id,
      absence.date,
      absence.createdAt,
      absence.userId,
      absence.userSubjectId,
    );
  }

  async deleteAbsence(userId: number, absenceId: number) {
    await this.prisma.$transaction(async (prisma) => {
      const deleted = await prisma.user_absence.delete({
        where: { id: absenceId, userId: userId },
      });
      await prisma.user_subject.update({
        where: { id: deleted.userSubjectId, userId: userId },
        data: { absences: { decrement: 1 } },
      });
    });
  }
}
