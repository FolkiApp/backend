import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(postId: number, userId: number, content: string) {}
}
