import { Injectable, Logger, Optional } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { EmptyPostException } from '../exceptions/empty-post.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { UploadImageErrorException } from '../exceptions/upload-image-error.exception';

@Injectable()
export class PostPostService {
  private readonly logger = new Logger(PostPostService.name);
  private S3 = new S3Client({
    region: process.env.AWS_REGION,
  });

  constructor(
    private readonly postRepository: PostRepository,
    @Optional() private readonly sqsService: SqsService,
  ) {}

  async execute(
    content: string,
    user: AuthUser,
    tags: string[],
    parentId?: number,
    files?: any[],
  ): Promise<Post> {
    this.logger.log({
      message: 'Creating post',
      userId: user.id,
      universityId: user.universityId,
      hasParent: !!parentId,
      parentId,
      tagsCount: tags.length,
      filesCount: files?.length || 0,
    });
    const imageKeys = await this.sendFilesToS3(files);
    return this.createPost(
      content,
      user.id,
      user.universityId,
      tags,
      parentId,
      imageKeys,
    );
  }

  async sendFilesToS3(files?: any[]): Promise<string[]> {
    const postKeys: string[] = [];
    if (!files || files.length === 0) {
      return postKeys;
    }

    for (const file of files) {
      const key = `posts/${Date.now()}-${file.originalname}`;
      try {
        await this.S3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
        postKeys.push(key);
        this.logger.log({
          message: 'Image uploaded successfully',
          key,
          fileName: file.originalname,
        });
      } catch (error) {
        this.logger.error({
          message: 'Error uploading image to S3',
          fileName: file.originalname,
          key,
          error: error instanceof Error ? error.message : error,
        });
        throw new UploadImageErrorException();
      }
    }
    return postKeys;
  }

  async createPost(
    content: string,
    userId: number,
    universityId: number | null,
    tags: string[],
    parentId?: number,
    imageKeys?: string[],
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
        imageKeys,
      );

      this.logger.log({
        message: 'Post created successfully',
        postId: post.id,
        userId,
        isComment: !!parentId,
        parentId,
      });

      if (parentId) {
        this.logger.log({
          message: 'Comment detected, sending notification',
          postId: post.id,
          parentId,
        });
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
