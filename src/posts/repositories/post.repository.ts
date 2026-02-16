import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(
    title: string,
    content: string,
    userId: number,
    tags: string[],
    parentId?: number | null,
  ): Promise<Post> {
    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          title,
          content,
          userId,
          commentsCount: 0,
          tags: tags,
          parentId: parentId ?? null,
        },
      });

      if (parentId) {
        await tx.post.update({
          where: { id: parentId },
          data: { commentsCount: { increment: 1 } },
        });
      }

      return created;
    });
    return new Post(
      post.id,
      post.postDate,
      post.title,
      post.content,
      post.userId,
      post.parentId,
      post.commentsCount,
      post.tags,
    );
  }

  async listPosts(quantity = 10): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      take: quantity,
      where: { parentId: null },
      orderBy: { id: 'desc' },
    });
    return posts.map(
      (post) =>
        new Post(
          post.id,
          post.postDate,
          post.title,
          post.content,
          post.userId,
          post.parentId,
          post.commentsCount,
          post.tags,
        ),
    );
  }

  async listNextPosts(lastId: number, quantity = 10): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      take: quantity,
      skip: 1,
      cursor: { id: lastId },
      where: { parentId: null },
      orderBy: { id: 'desc' },
    });
    return posts.map(
      (post) =>
        new Post(
          post.id,
          post.postDate,
          post.title,
          post.content,
          post.userId,
          post.parentId,
          post.commentsCount,
          post.tags,
        ),
    );
  }

  async listChildrenByParentId(parentId: number): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: { parentId },
      orderBy: { id: 'asc' },
    });
    return posts.map(
      (post) =>
        new Post(
          post.id,
          post.postDate,
          post.title,
          post.content,
          post.userId,
          post.parentId,
          post.commentsCount,
          post.tags,
        ),
    );
  }

  async getPostById(id: number): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return null;
    }

    return new Post(
      post.id,
      post.postDate,
      post.title,
      post.content,
      post.userId,
      post.parentId,
      post.commentsCount,
      post.tags,
    );
  }

  async deletePost(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id },
      });

      if (post?.parentId) {
        await tx.post.update({
          where: { id: post.parentId },
          data: { commentsCount: { decrement: 1 } },
        });
      }

      await tx.post.delete({
        where: { id },
      });
    });
  }
}
