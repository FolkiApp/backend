import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { University } from '../entities/university.entity';

@Injectable()
export class UniversityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<University[]> {
    return this.prisma.university.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
