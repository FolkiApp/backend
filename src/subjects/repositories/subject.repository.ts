import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Subject } from '../entities/subject.entity';

@Injectable()
export class SubjectRepository {
  constructor(private prisma: PrismaService) {}

  async findManyByCodes(codes: string[]): Promise<Subject[]> {
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
  ): Promise<Subject> {
    return this.prisma.subject.create({
      data: {
        code,
        name,
        universityId,
      },
    });
  }

  async findById(subjectId: number): Promise<Subject | null> {
    return this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
  }
}
