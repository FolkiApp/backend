import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { University } from '../entities/university.entity';
import { CreateUniversityDto } from '../dto/create-university.dto';

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

  async findBySlug(slug: string): Promise<University | null> {
    return this.prisma.university.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  async create(data: CreateUniversityDto): Promise<University> {
    return this.prisma.university.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }
}
