import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportantDate } from '../entities/important-date.entity';
import { ImportantDateType } from '../entities/important-date-type.entity';
import { CreateImportantDateDataDto } from '../dtos/create-important-date-data.dto';

export type WeeklyImportantDate = {
  id: number;
  name: string;
  date: Date;
  universityId: number | null;
  campusId: number | null;
};

@Injectable()
export class ImportantDateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    startOfYear: Date,
    universityId: number,
    campusId: number | null,
  ): Promise<ImportantDate[]> {
    const dates = await this.prisma.important_date.findMany({
      orderBy: { date: 'asc' },
      where: {
        date: { gte: startOfYear },
        universityId,
        OR:
          campusId !== null
            ? [{ campusId }, { campusId: null }]
            : [{ campusId: null }],
      },
    });

    return dates.map((d) => ({
      ...d,
      type: d.type as ImportantDateType,
    }));
  }

  async create(data: CreateImportantDateDataDto): Promise<ImportantDate> {
    const created = await this.prisma.important_date.create({
      data: {
        ...data,
        type: data.type,
      },
    });

    return {
      ...created,
      type: created.type as ImportantDateType,
    };
  }

  async delete(importantDateId: number): Promise<void> {
    await this.prisma.important_date.delete({
      where: { id: importantDateId },
    });
  }

  async findDayOffBetweenDates(
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyImportantDate[]> {
    const dates = await this.prisma.important_date.findMany({
      where: {
        type: 'DAY_OFF',
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
      orderBy: { date: 'asc' },
    });

    return dates;
  }
}
