import { Injectable, Logger } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';

@Injectable()
export class ListPostChildrenService {
  private readonly logger = new Logger(ListPostChildrenService.name);

  constructor(private readonly postRepository: PostRepository) {}

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
