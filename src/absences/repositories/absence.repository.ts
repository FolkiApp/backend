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
    return this.prisma.user_absence.findMany({
      where: { userId: userId, userSubjectId: subjectId },
      orderBy: { date: 'desc' },
    });
  }
}
