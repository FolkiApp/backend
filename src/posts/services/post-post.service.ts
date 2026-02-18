import { Injectable, Optional } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { InappropriateContentException } from '../exceptions/inappropriate-content.exception';
import { ModerationService } from './moderation.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

@Injectable()
export class PostPostService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly postRepository: PostRepository,
    private readonly moderationService: ModerationService,
    @Optional() private readonly sqsService: SqsService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(PostPostService.name);
  }

  async execute(
    content: string,
    user: AuthUser,
    tags: string[],
    parentId?: number,
  ): Promise<Post> {
    this.logger.log({
      message: 'Creating post',
      userId: user.id,
      universityId: user.universityId,
      hasParent: !!parentId,
      parentId,
      tagsCount: tags.length,
    });

    this.validateContent(content);
    await this.moderateContent(content, user.id);

    if (parentId) await this.validateParent(parentId);

    const post = await this.persistPost(
      content,
      user.id,
      user.universityId,
      tags,
      parentId,
    );

    if (parentId) await this.notifyComment(post, user.id, parentId);

    return post;
  }
  private validateContent(content: string): void {
    if (!content?.trim()) {
      throw new EmptyPostException();
    }
  }

  private async moderateContent(
    content: string,
    userId: number,
  ): Promise<void> {
    const moderationResult =
      await this.moderationService.moderateContent(content);
    if (moderationResult.flagged) {
      this.logger.warn({
        message: 'Content flagged by moderation',
        userId,
        categories: moderationResult.categories,
      });
      throw new InappropriateContentException();
    }
  }

  private async validateParent(parentId: number): Promise<void> {
    const parent = await this.postRepository.getPostById(parentId);
    if (!parent) {
      throw new NotFoundPostException();
    }
  }

  private async persistPost(
    content: string,
    userId: number,
    universityId: number | null,
    tags: string[],
    parentId?: number,
  ): Promise<Post> {
    try {
      const post = await this.postRepository.createPost(
        content,
        userId,
        universityId,
        tags,
        parentId,
      );

      this.logger.log({
        message: 'Post created successfully',
        postId: post.id,
        userId,
        isComment: !!parentId,
        parentId,
      });

      return post;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error creating post',
        error: error instanceof Error ? error.message : error,
      });
      throw new PostInternalErrorException();
    }
  }

  private async notifyComment(
    post: Post,
    userId: number,
    parentId: number,
  ): Promise<void> {
    await this.sendCommentNotification(
      post.id,
      userId,
      post.userName,
      parentId,
    );
  }

  private async sendCommentNotification(
    postId: number,
    commentAuthorId: number,
    commentAuthorName: string,
    parentId: number,
  ): Promise<void> {
    if (!this.sqsService) {
      this.logger.error({
        message: 'Sqs not configured, cannot send comment notification',
        postId,
        parentId,
      });
      return;
    }

    try {
      this.logger.log({
        message: 'Sending to SQS',
        queueName: 'post-notifications',
        payload: {
          postId,
          commentAuthorId,
          commentAuthorName,
          parentId,
        },
      });

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
        message: 'Post notification sent to SQS successfully',
        postId,
        parentId,
        queueName: 'post-notifications',
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to send post notification to SQS',
        postId,
        parentId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}
