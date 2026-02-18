import { Injectable } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';

@Injectable()
export class GetPostByIdService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly postRepository: PostRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(GetPostByIdService.name);
  }

  async execute(postId: number): Promise<Post> {
    this.logger.log({ message: 'Getting post by ID', postId });

    try {
      const post = await this.postRepository.getPostById(postId);

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
