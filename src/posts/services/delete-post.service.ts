import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostsRepository } from '../repositories/posts.repository';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';
import { UnauthorizedPostException } from '../exceptions/unauthorized-post.exception';

@Injectable()
export class DeletePostService {
  private readonly logger = new Logger(DeletePostService.name);

  constructor(private readonly postsRepository: PostsRepository) {}

  async execute(postId: number, user: AuthUser): Promise<void> {
    this.logger.log({ message: 'Deleting Post', postId, userId: user.id });
    return this.deletePost(postId, user.id);
  }

  async deletePost(postId: number, userId: number): Promise<void> {
    try {
      const post = await this.postsRepository.getPostById(postId);

      if (!post) {
        throw new NotFoundPostException('Post not found');
      }

      if (post.userId !== userId) {
        throw new UnauthorizedPostException(
          'You are not authorized to delete this post',
        );
      }

      await this.postsRepository.deletePost(postId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error deleting post',
        error: error instanceof Error ? error.message : error,
      });

      if (
        error instanceof NotFoundPostException ||
        error instanceof UnauthorizedPostException
      ) {
        throw error;
      }

      throw new PostInternalErrorException();
    }
  }
}
