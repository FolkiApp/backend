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
  badge: string | null;
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
          upvotes: 1,
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
              badge: true,
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

      await tx.vote.create({
        data: {
          postId: created.id,
          userId,
          up: true,
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
      'up',
      postWithUser.user.badge,
    );
  }

  async listPosts(
    quantity = 10,
    universityId: number | null,
    tags?: string[],
    userId?: number,
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
            badge: true,
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

    const postIds = posts.map((p) => p.id);
    const votes = userId
      ? await this.prisma.vote.findMany({
          where: {
            postId: { in: postIds },
            userId,
          },
        })
      : [];
    const voteMap = new Map(votes.map((v) => [v.postId, v.up ? 'up' : 'down']));

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

      const voted = (voteMap.get(post.id) as 'up' | 'down') ?? null;

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
        voted,
        postWithUser.user.badge,
      );
    });
  }

  async listNextPosts(
    lastId: number,
    quantity = 10,
    universityId: number | null,
    tags?: string[],
    userId?: number,
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
            badge: true,
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

    const postIds = posts.map((p) => p.id);
    const votes = userId
      ? await this.prisma.vote.findMany({
          where: {
            postId: { in: postIds },
            userId,
          },
        })
      : [];
    const voteMap = new Map(votes.map((v) => [v.postId, v.up ? 'up' : 'down']));

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

      const voted = (voteMap.get(post.id) as 'up' | 'down') ?? null;

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
        voted,
        postWithUser.user.badge,
      );
    });
  }

  async listChildrenByParentId(
    parentId: number,
    userId?: number,
  ): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: { parentId },
      include: {
        user: {
          select: {
            name: true,
            badge: true,
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

    const postIds = posts.map((p) => p.id);
    const votes = userId
      ? await this.prisma.vote.findMany({
          where: {
            postId: { in: postIds },
            userId,
          },
        })
      : [];
    const voteMap = new Map(votes.map((v) => [v.postId, v.up ? 'up' : 'down']));

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

      const voted = (voteMap.get(post.id) as 'up' | 'down') ?? null;

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
        voted,
        postWithUser.user.badge,
      );
    });
  }

  async getPostById(id: number, userId?: number): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            badge: true,
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

    let voted: 'up' | 'down' | null = null;
    if (userId) {
      const vote = await this.prisma.vote.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId,
          },
        },
      });
      voted = vote ? (vote.up ? 'up' : 'down') : null;
    }

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
      voted,
      postWithUser.user.badge,
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

  async votePost(
    postId: number,
    userId: number,
    upvote: boolean,
  ): Promise<boolean> {
    await this.prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (!existingVote) {
        await tx.vote.create({
          data: {
            postId,
            userId,
            up: upvote,
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            ...(upvote
              ? { upvotes: { increment: 1 } }
              : { downvotes: { increment: 1 } }),
          },
        });

        return;
      }

      if (existingVote.up === upvote) {
        await tx.vote.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: upvote
            ? { upvotes: { decrement: 1 } }
            : { downvotes: { decrement: 1 } },
        });

        return;
      }

      await tx.vote.update({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
        data: {
          up: upvote,
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          ...(upvote
            ? {
                upvotes: { increment: 1 },
                downvotes: { decrement: 1 },
              }
            : {
                upvotes: { decrement: 1 },
                downvotes: { increment: 1 },
              }),
        },
      });
    });

    return true;
  }
}
