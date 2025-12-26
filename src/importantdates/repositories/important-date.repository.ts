import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { institute } from '@prisma/client';
import { importantDates } from '../entities/importante-date.entity';

@Injectable()
export class ImportantDateRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(
    startOfYear: Date,
    universityId: number,
    campusId: number | null,
  ): Promise<importantDates[]> {
    return this.prisma.important_date.findMany({
      orderBy: { date: 'asc' },
      where: {
        date: { gte: startOfYear },
        universityId,
        campusId,
      },
    });
  }
}
