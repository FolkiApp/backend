import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(
    content: string,
    userId: number,
    universityId: number | null,
    tags: string[],
    parentId?: number | null,
  ): Promise<Post> {
    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          content,
          userId,
          universityId,
          commentsCount: 0,
          tags: tags,
          parentId: parentId ?? null,
        },
        include: {
          user: {
            select: {
              name: true,
              institute: {
                select: {
                  name: true,
                },
              },
            },
          },
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

    // eslint-disable-next-line
    const nameParts: string[] = post.user.name.trim().split(/\s+/);
    const userName: string =
      nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
        : nameParts[0];

    return new Post(
      post.id,
      post.postDate,
      post.content,
      post.userId,
      userName,
      // eslint-disable-next-line
      post.user.institute?.name ?? null,
      post.parentId,
      post.commentsCount,
      post.tags,
      post.universityId,
    );
  }

  async listPosts(
    quantity = 10,
    universityId: number | null,
    tags?: string[],
  ): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      take: quantity,
      where: {
        parentId: null,
        ...(universityId ? { universityId } : {}),
        ...(tags && tags.length > 0
          ? {
              tags: {
                hasEvery: tags,
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            institute: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
    return posts.map((post) => {
      const nameParts: string[] = post.user.name.trim().split(/\s+/);
      const userName: string =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
          : nameParts[0];

      return new Post(
        post.id,
        post.postDate,
        post.content,
        post.userId,
        userName,
        post.user.institute?.name ?? null,
        post.parentId,
        post.commentsCount,
        post.tags,
        post.universityId,
      );
    });
  }

  async listNextPosts(
    lastId: number,
    quantity = 10,
    universityId: number | null,
    tags?: string[],
  ): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      take: quantity,
      skip: 1,
      cursor: { id: lastId },
      where: {
        parentId: null,
        ...(universityId ? { universityId } : {}),
        ...(tags && tags.length > 0
          ? {
              tags: {
                hasEvery: tags,
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            institute: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
    return posts.map((post) => {
      const nameParts: string[] = post.user.name.trim().split(/\s+/);
      const userName: string =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
          : nameParts[0];

      return new Post(
        post.id,
        post.postDate,
        post.content,
        post.userId,
        userName,
        post.user.institute?.name ?? null,
        post.parentId,
        post.commentsCount,
        post.tags,
        post.universityId,
      );
    });
  }

  async listChildrenByParentId(parentId: number): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: { parentId },
      include: {
        user: {
          select: {
            name: true,
            institute: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    return posts.map((post) => {
      const nameParts: string[] = post.user.name.trim().split(/\s+/);
      const userName: string =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
          : nameParts[0];

      return new Post(
        post.id,
        post.postDate,
        post.content,
        post.userId,
        userName,
        post.user.institute?.name ?? null,
        post.parentId,
        post.commentsCount,
        post.tags,
        post.universityId,
      );
    });
  }

  // async getPostById(id: number): Promise<Post | null> {
  //   const post = await this.prisma.post.findUnique({
  //     where: { id },
  //     include: {
  //       user: {
  //         select: {
  //           name: true,
  //           institute: {
  //             select: {
  //               name: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   if (!post) {
  //     return null;
  //   }

  //   const nameParts: string[] = post.user.name.trim().split(/\s+/);

  //   const userName: string =
  //     nameParts.length > 1
  //       ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
  //       : nameParts[0];

  //   return new Post(
  //     post.id,
  //     post.postDate,
  //     post.content,
  //     post.userId,
  //     userName,
  //     post.user.institute?.name ?? null,
  //     post.parentId,
  //     post.commentsCount,
  //     post.tags,
  //     post.universityId,
  //   );
  // }

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

  async getUserIdsWhoCommented(postId: number): Promise<number[]> {
    const comments = await this.prisma.post.findMany({
      where: {
        parentId: postId,
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return comments.map((comment) => comment.userId);
  }
}
