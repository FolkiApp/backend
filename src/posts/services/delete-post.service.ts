import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { UnauthorizedPostException } from '../exceptions/unauthorized-post.exception';
import { Post } from '../entities/post.entity';

@Injectable()
export class DeletePostService {
  private readonly logger = new Logger(DeletePostService.name);

  constructor(private readonly postsRepository: PostRepository) {}

  async execute(postId: number, user: AuthUser): Promise<void> {
    this.logger.log({ message: 'Deleting Post', postId, userId: user.id });
    const post = await this.findPost(postId);
    this.verifyUserAuthorship(post, user.id);
    return this.deletePost(postId);
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
