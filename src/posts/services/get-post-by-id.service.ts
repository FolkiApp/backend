import { Injectable, Logger } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

@Injectable()
export class GetPostByIdService {
  private readonly logger = new Logger(GetPostByIdService.name);

  constructor(private readonly postRepository: PostRepository) {}

  async execute(postId: number, userId: number): Promise<Post> {
    this.logger.log({ message: 'Getting post by ID', postId });

    try {
      const post = await this.postRepository.getPostById(postId, userId);

      if (!post) {
        throw new NotFoundPostException();
      }

      return post;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error getting post by ID',
        postId,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof NotFoundPostException) {
        throw error;
      }

      throw new PostInternalErrorException();
    }
  }
}
