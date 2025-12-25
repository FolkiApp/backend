import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { institute } from '@prisma/client';

@Injectable()
export class ImportantDatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFromDateByUniversityAndCampus(
    startOfYear: Date,
    universityId: number,
    campusId: number | null
  ) {
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
