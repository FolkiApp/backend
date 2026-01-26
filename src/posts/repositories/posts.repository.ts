import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostsEntity } from '../entities/posts.entity';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(
    title: string,
    content: string,
    userId: number,
  ): Promise<PostsEntity> {
    const post = await this.prisma.post.create({
      data: {
        title,
        content,
        userId,
        commentsCount: 0,
      },
    });
    return new PostsEntity(
      post.id,
      post.postDate,
      post.title,
      post.content,
      post.userId,
      post.commentsCount,
    );
  }
}
