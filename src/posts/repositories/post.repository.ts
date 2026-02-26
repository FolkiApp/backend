import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Post } from '../entities/post.entity';
import { S3Service } from '../../common/services/s3.service';

interface PostKeyItem {
  key: string;
}

interface PostWithImages {
  postKeys: PostKeyItem[];
}

interface UserInfo {
  name: string;
  institute: { name: string } | null;
}

interface PostWithUser {
  user: UserInfo;
}

@Injectable()
export class PostRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createPost(
    content: string,
    userId: number,
    universityId: number | null,
    tags: string[],
    parentId?: number | null,
    imageKeys?: string[],
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
          postKeys:
            imageKeys && imageKeys.length > 0
              ? {
                  create: imageKeys.map((key) => ({ key })),
                }
              : undefined,
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
          postKeys: {
            select: {
              key: true,
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

    const postWithUser = post as unknown as PostWithUser;
    const nameParts: string[] = postWithUser.user.name.trim().split(/\s+/);
    const userName: string =
      nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
        : nameParts[0];

    const postImages = (post as unknown as PostWithImages).postKeys;
    const keys = postImages.map((img) => img.key);
    const imageUrls = keys.length > 0 ? this.s3Service.getPublicUrls(keys) : [];

    return new Post(
      post.id,
      post.postDate,
      post.content,
      post.userId,
      userName,
      postWithUser.user.institute?.name ?? null,
      post.parentId,
      post.commentsCount,
      post.tags,
      post.universityId,
      imageUrls,
      post.upvotes,
      post.downvotes,
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
        postKeys: {
          select: {
            key: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
    return posts.map((post) => {
      const postWithUser = post as unknown as PostWithUser;
      const nameParts: string[] = postWithUser.user.name.trim().split(/\s+/);
      const userName: string =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
          : nameParts[0];

      const postImages = (post as unknown as PostWithImages).postKeys;
      const keys = postImages.map((img) => img.key);
      const imageUrls =
        keys.length > 0 ? this.s3Service.getPublicUrls(keys) : [];

      return new Post(
        post.id,
        post.postDate,
        post.content,
        post.userId,
        userName,
        postWithUser.user.institute?.name ?? null,
        post.parentId,
        post.commentsCount,
        post.tags,
        post.universityId,
        imageUrls,
        post.upvotes,
        post.downvotes,
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
        postKeys: {
          select: {
            key: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
    return posts.map((post) => {
      const postWithUser = post as unknown as PostWithUser;
      const nameParts: string[] = postWithUser.user.name.trim().split(/\s+/);
      const userName: string =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
          : nameParts[0];

      const postImages = (post as unknown as PostWithImages).postKeys;
      const keys = postImages.map((img) => img.key);
      const imageUrls =
        keys.length > 0 ? this.s3Service.getPublicUrls(keys) : [];

      return new Post(
        post.id,
        post.postDate,
        post.content,
        post.userId,
        userName,
        postWithUser.user.institute?.name ?? null,
        post.parentId,
        post.commentsCount,
        post.tags,
        post.universityId,
        imageUrls,
        post.upvotes,
        post.downvotes,
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
        postKeys: {
          select: {
            key: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    return posts.map((post) => {
      const postWithUser = post as unknown as PostWithUser;
      const nameParts: string[] = postWithUser.user.name.trim().split(/\s+/);
      const userName: string =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
          : nameParts[0];

      const postImages = (post as unknown as PostWithImages).postKeys;
      const keys = postImages.map((img) => img.key);
      const imageUrls =
        keys.length > 0 ? this.s3Service.getPublicUrls(keys) : [];

      return new Post(
        post.id,
        post.postDate,
        post.content,
        post.userId,
        userName,
        postWithUser.user.institute?.name ?? null,
        post.parentId,
        post.commentsCount,
        post.tags,
        post.universityId,
        imageUrls,
        post.upvotes,
        post.downvotes,
      );
    });
  }

  async getPostById(id: number): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
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
        postKeys: {
          select: {
            key: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    const postWithUser = post as unknown as PostWithUser;
    const nameParts: string[] = postWithUser.user.name.trim().split(/\s+/);

    const userName: string =
      nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
        : nameParts[0];

    const postImages = (post as unknown as PostWithImages).postKeys;
    const keys = postImages.map((img) => img.key);
    const imageUrls = keys.length > 0 ? this.s3Service.getPublicUrls(keys) : [];

    return new Post(
      post.id,
      post.postDate,
      post.content,
      post.userId,
      userName,
      postWithUser.user.institute?.name ?? null,
      post.parentId,
      post.commentsCount,
      post.tags,
      post.universityId,
      imageUrls,
      post.upvotes,
      post.downvotes,
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

  async getPostImageKeys(id: number): Promise<string[]> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: {
        postKeys: {
          select: {
            key: true,
          },
        },
      },
    });

    if (!post) {
      return [];
    }

    const postImages = (post as unknown as PostWithImages).postKeys;
    return postImages.map((img) => img.key);
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

  async vote_post(
    postId: number,
    userId: number,
    upvote: boolean,
    downvote: boolean,
  ): Promise<boolean> {
    await this.prisma.$transaction(async (tx) => {
      const existingVote = await tx.votes.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (!existingVote) {
        await tx.votes.create({
          data: {
            postId,
            userId,
            up: upvote,
            down: downvote,
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            ...(upvote ? { upvotes: { increment: 1 } } : {}),
            ...(downvote ? { downvotes: { increment: 1 } } : {}),
          },
        });

        return;
      }

      if (existingVote.up === upvote && existingVote.down === downvote) {
        return;
      }

      await tx.votes.update({
        where: { id: existingVote.id },
        data: {
          up: upvote,
          down: downvote,
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          ...(existingVote.up !== upvote
            ? { upvotes: upvote ? { increment: 1 } : { decrement: 1 } }
            : {}),
          ...(existingVote.down !== downvote
            ? { downvotes: downvote ? { increment: 1 } : { decrement: 1 } }
            : {}),
        },
      });
    });

    return true;
  }
}
