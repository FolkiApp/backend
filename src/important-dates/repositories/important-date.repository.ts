import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportDateType } from '@prisma/client';

export interface WeeklyImportantDate {
  id: number;
  name: string;
  date: Date;
  universityId: number | null;
  campusId: number | null;
}

@Injectable()
export class ImportantDateRepository {
  constructor(private prisma: PrismaService) {}

  async findDayOffBetweenDates(
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyImportantDate[]> {
    return this.prisma.important_date.findMany({
      where: {
        type: ImportDateType.DAY_OFF,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        universityId: true,
        campusId: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
}
