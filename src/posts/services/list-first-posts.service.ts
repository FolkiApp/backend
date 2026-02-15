import { Injectable, Logger } from '@nestjs/common';
import { PostsRepository } from '../repositories/posts.repository';
import { Posts } from '../entities/posts.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';

@Injectable()
export class ListFirstPostsService {
  private readonly logger = new Logger(ListFirstPostsService.name);

  constructor(private readonly postRepository: PostsRepository) {}

  async execute(quantity: number, lastId?: number): Promise<Posts[]> {
    this.logger.log({ message: 'Listing batch of Posts' });
    if (!lastId) {
      return this.listFirstPosts(quantity);
    } else {
      return this.listNextPosts(lastId, quantity);
    }
  }
  async listFirstPosts(quantity: number): Promise<Posts[]> {
    try {
      const posts = await this.postRepository.listPosts(quantity);
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

  async listNextPosts(lastId: number, quantity: number): Promise<Posts[]> {
    try {
      const posts = await this.postRepository.listNextPosts(lastId, quantity);
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
