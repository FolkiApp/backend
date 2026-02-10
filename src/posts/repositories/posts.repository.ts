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
    tags: string[],
    parentPostId?: number,
  ): Promise<PostsEntity> {
    const post = await this.prisma.post.create({
      data: {
        title,
        content,
        userId,
        tags: tags,
        parentPostId: parentPostId || null,
      },
    });
    return new PostsEntity(
      post.id,
      post.postDate,
      post.title,
      post.content,
      post.userId,
      post.parentPostId,
      post.tags,
    );
  }

  async listPosts(quantity = 10): Promise<PostsEntity[]> {
    const posts = await this.prisma.post.findMany({
      take: quantity,
      where: { parentPostId: null },
      orderBy: { id: 'desc' },
    });
    return posts.map(
      (post) =>
        new PostsEntity(
          post.id,
          post.postDate,
          post.title,
          post.content,
          post.userId,
          post.parentPostId,
          post.tags,
        ),
    );
  }

  async listNextPosts(lastId: number, quantity = 10): Promise<PostsEntity[]> {
    const posts = await this.prisma.post.findMany({
      take: quantity,
      skip: 1,
      cursor: { id: lastId },
      where: { parentPostId: null },
      orderBy: { id: 'desc' },
    });
    return posts.map(
      (post) =>
        new PostsEntity(
          post.id,
          post.postDate,
          post.title,
          post.content,
          post.userId,
          post.parentPostId,
          post.tags,
        ),
    );
  }

  async getPostById(id: number): Promise<PostsEntity | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return null;
    }

    return new PostsEntity(
      post.id,
      post.postDate,
      post.title,
      post.content,
      post.userId,
      post.parentPostId,
      post.tags,
    );
  }

  async deletePost(id: number): Promise<void> {
    await this.prisma.post.delete({
      where: { id },
    });
  }

  async listChildPosts(
    parentPostId: number,
    quantity = 10,
  ): Promise<PostsEntity[]> {
    const posts = await this.prisma.post.findMany({
      where: { parentPostId },
      take: quantity,
      orderBy: { id: 'desc' },
    });
    return posts.map(
      (post) =>
        new PostsEntity(
          post.id,
          post.postDate,
          post.title,
          post.content,
          post.userId,
          post.parentPostId,
          post.tags,
        ),
    );
  }

  async listNextChildPosts(
    parentPostId: number,
    lastId: number,
    quantity = 10,
  ): Promise<PostsEntity[]> {
    const posts = await this.prisma.post.findMany({
      where: { parentPostId },
      take: quantity,
      skip: 1,
      cursor: { id: lastId },
      orderBy: { id: 'desc' },
    });
    return posts.map(
      (post) =>
        new PostsEntity(
          post.id,
          post.postDate,
          post.title,
          post.content,
          post.userId,
          post.parentPostId,
          post.tags,
        ),
    );
  }
}
