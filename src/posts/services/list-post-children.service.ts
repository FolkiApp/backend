import { Injectable } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';

@Injectable()
export class ListPostChildrenService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly postRepository: PostRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(ListPostChildrenService.name);
  }

  async execute(parentId: number): Promise<Post[]> {
    this.logger.log({ message: 'Listing children posts' });
    return this.listChildren(parentId);
  }

  async listChildren(parentId: number): Promise<Post[]> {
    try {
      const parent = await this.postRepository.getPostById(parentId);
      if (!parent) {
        throw new NotFoundPostException('Parent post not found');
      }

      const posts = await this.postRepository.listChildrenByParentId(parentId);
      return posts;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching children posts',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof NotFoundPostException) {
        throw error;
      }
      throw new PostInternalErrorException();
    }
  }
}
