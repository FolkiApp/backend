import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { subject } from '@prisma/client';

@Injectable()
export class SubjectRepository {
  constructor(private prisma: PrismaService) {}

  async findManyByCodes(codes: string[]): Promise<subject[]> {
    return this.prisma.subject.findMany({
      where: {
        code: {
          in: codes,
        },
      },
    });
  }

  async create(
    code: string,
    name: string,
    universityId: number,
  ): Promise<subject> {
    return this.prisma.subject.create({
      data: {
        code,
        name,
        universityId,
      },
    });
  }
}
