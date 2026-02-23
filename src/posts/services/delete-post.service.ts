import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { UnauthorizedPostException } from '../exceptions/unauthorized-post.exception';
import { Post } from '../entities/post.entity';
import { S3Service } from '../../common/services/s3.service';

@Injectable()
export class DeletePostService {
  private readonly logger = new Logger(DeletePostService.name);

  constructor(
    private readonly postsRepository: PostRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(postId: number, user: AuthUser): Promise<void> {
    this.logger.log({ message: 'Deleting Post', postId, userId: user.id });
    const post = await this.findPost(postId);
    this.verifyUserAuthorship(post, user.id);
    await this.deletePostImages(postId);
    return this.deletePost(postId);
  }

  private async deletePostImages(postId: number): Promise<void> {
    try {
      const imageKeys = await this.postsRepository.getPostImageKeys(postId);

      if (imageKeys.length > 0) {
        await this.s3Service.deleteObjects(imageKeys);
        this.logger.log({
          message: 'Post images deleted from S3',
          postId,
          imagesCount: imageKeys.length,
        });
      }
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error deleting post images',
        postId,
        error: error instanceof Error ? error.message : error,
      });
      // Não vamos lançar erro aqui para não bloquear a deleção do post
      // mas logamos o erro para investigação
    }
  }

  private async findPost(postId: number) {
    try {
      const post = await this.postsRepository.getPostById(postId);

      if (!post) {
        throw new NotFoundPostException('Post not found');
      }

      return post;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error finding post',
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof NotFoundPostException) {
        throw error;
      }

      throw new PostInternalErrorException();
    }
  }

  private verifyUserAuthorship(post: Post, userId: number): void {
    try {
      if (post.userId !== userId) {
        throw new UnauthorizedPostException();
      }
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error verifying user authorship',
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof UnauthorizedPostException) {
        throw error;
      }

      throw new PostInternalErrorException();
    }
  }

  private async deletePost(postId: number): Promise<void> {
    try {
      await this.postsRepository.deletePost(postId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error deleting post',
        error: error instanceof Error ? error.message : error,
      });
      throw new PostInternalErrorException();
    }
  }
}
