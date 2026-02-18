import { Injectable } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';

@Injectable()
export class ListFirstPostService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly postRepository: PostRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(ListFirstPostService.name);
  }

  async execute(
    quantity: number,
    universityId: number | null,
    lastId?: number,
    tags?: string[],
  ): Promise<Post[]> {
    this.logger.log({ message: 'Listing batch of Posts' });
    if (!lastId) {
      return this.listFirstPosts(quantity, universityId, tags);
    } else {
      return this.listNextPosts(lastId, quantity, universityId, tags);
    }
  }
  async listFirstPosts(
    quantity: number,
    universityId: number | null,
    tags?: string[],
  ): Promise<Post[]> {
    try {
      const posts = await this.postRepository.listPosts(
        quantity,
        universityId,
        tags,
      );
      if (!posts) {
        throw new NotFoundPostException();
      }
      return posts;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching posts',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof NotFoundPostException) {
        throw new NotFoundPostException();
      }
      throw new PostInternalErrorException();
    }
  }

  async listNextPosts(
    lastId: number,
    quantity: number,
    universityId: number | null,
    tags?: string[],
  ): Promise<Post[]> {
    try {
      const posts = await this.postRepository.listNextPosts(
        lastId,
        quantity,
        universityId,
        tags,
      );
      if (!posts) {
        throw new NotFoundPostException();
      }
      return posts;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching posts',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof NotFoundPostException) {
        throw new NotFoundPostException();
      }
      throw new PostInternalErrorException();
    }
  }
}
