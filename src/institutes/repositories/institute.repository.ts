import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { institute } from '@prisma/client';

@Injectable()
export class InstituteRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<institute | null> {
    return this.prisma.institute.findUnique({
      where: {
        id
      },
    });
  }

  async findByNameAndUniversity(
    name: string,
    universityId: number,
  ): Promise<institute | null> {
    return this.prisma.institute.findFirst({
      where: {
        name,
        universityId,
      },
    });
  }

  async create(name: string, universityId: number): Promise<institute> {
    return this.prisma.institute.create({
      data: {
        name,
        universityId,
      },
    });
  }

  async findOrCreate(name: string, universityId: number): Promise<institute> {
    const existing = await this.findByNameAndUniversity(name, universityId);
    if (existing) {
      return existing;
    }
    return this.create(name, universityId);
  }
}
