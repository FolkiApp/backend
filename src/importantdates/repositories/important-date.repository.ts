import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ImportantDate,
  ImportantDateType,
} from '../entities/important-date.entity';

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
}
