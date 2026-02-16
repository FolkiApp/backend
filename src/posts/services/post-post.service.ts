import { Injectable, Logger, Optional } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';

@Injectable()
export class PostPostService {
  private readonly logger = new Logger(PostPostService.name);

  constructor(
    private readonly postRepository: PostRepository,
    @Optional() private readonly sqsService: SqsService,
  ) {}

  async execute(
    content: string,
    user: AuthUser,
    tags: string[],
    parentId?: number,
  ): Promise<Post> {
    this.logger.log({ message: 'Creating Post' });
    return this.createPost(content, user.id, user.universityId, tags, parentId);
  }
  async createPost(
    content: string,
    userId: number,
    universityId: number | null,
    tags: string[],
    parentId?: number,
  ): Promise<Post> {
    if (!content?.trim()) {
      throw new EmptyPostException();
    }
    try {
      if (parentId) {
        const parent = await this.postRepository.getPostById(parentId);
        if (!parent) {
          throw new NotFoundPostException();
        }
      }
      const post = await this.postRepository.createPost(
        content,
        userId,
        universityId,
        tags,
        parentId,
      );

      if (parentId) {
        await this.sendCommentNotification(
          post.id,
          userId,
          post.userName,
          parentId,
        );
      }

      return post;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating post',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof NotFoundPostException) {
        throw error;
      }
      throw new PostInternalErrorException();
    }
  }

  private async sendCommentNotification(
    postId: number,
    commentAuthorId: number,
    commentAuthorName: string,
    parentId: number,
  ): Promise<void> {
    if (!this.sqsService) {
      this.logger.warn({
        message: 'SQS not configured, skipping comment notification',
        postId,
      });
      return;
    }

    try {
      await this.sqsService.send('post-notifications', {
        id: `post-${postId}-${Date.now()}`,
        body: {
          postId,
          commentAuthorId,
          commentAuthorName,
          parentId,
        },
      });

      this.logger.log({
        message: 'Post notification sent to SQS',
        postId,
        parentId,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to send post notification to SQS',
        postId,
        parentId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
