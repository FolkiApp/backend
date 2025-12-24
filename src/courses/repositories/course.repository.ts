import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { course } from '@prisma/client';

@Injectable()
export class CourseRepository {
  constructor(private prisma: PrismaService) {}

  async findByNameAndUniversity(
    name: string,
    universityId: number,
  ): Promise<course | null> {
    return this.prisma.course.findFirst({
      where: {
        name,
        universityId,
      },
    });
  }

  async create(name: string, universityId: number): Promise<course> {
    return this.prisma.course.create({
      data: {
        name,
        universityId,
      },
    });
  }

  async findOrCreate(name: string, universityId: number): Promise<course> {
    const existing = await this.findByNameAndUniversity(name, universityId);
    if (existing) {
      return existing;
    }
    return this.create(name, universityId);
  }
}
