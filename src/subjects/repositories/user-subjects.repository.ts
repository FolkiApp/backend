import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserSubjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdAndUserId(
    userSubjectId: number,
    userId: number,
  ): Promise<{ id: number } | null> {
    return await this.prisma.user_subject.findFirst({
      where: {
        id: userSubjectId,
        userId,
      },
      select: {
        id: true,
      },
    });
  }
}
