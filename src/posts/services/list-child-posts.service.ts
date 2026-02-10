import { Injectable, Logger } from '@nestjs/common';
import { PostsRepository } from '../repositories/posts.repository';
import { PostsEntity } from '../entities/posts.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';

@Injectable()
export class ListChildPostsService {
  private readonly logger = new Logger(ListChildPostsService.name);

  constructor(private readonly postRepository: PostsRepository) {}

  async execute(
    parentPostId: number,
    quantity: number,
  ): Promise<PostsEntity[]> {
    this.logger.log({
      message: 'Listing child posts',
      parentPostId,
      quantity,
    });
    return this.listChildPosts(parentPostId, quantity);
  }

  async listChildPosts(
    parentPostId: number,
    quantity: number,
  ): Promise<PostsEntity[]> {
    try {
      const posts = await this.postRepository.listChildPosts(
        parentPostId,
        quantity,
      );
      if (!posts) {
        throw new NotFoundPostException();
      }
      return posts;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching child posts',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof NotFoundPostException) {
        throw new NotFoundPostException();
      }
      throw new PostInternalErrorException();
    }
  }

  async executeNext(
    parentPostId: number,
    lastId: number,
    quantity: number,
  ): Promise<PostsEntity[]> {
    this.logger.log({
      message: 'Listing next batch of child posts',
      parentPostId,
      lastId,
      quantity,
    });
    return this.listNextChildPosts(parentPostId, lastId, quantity);
  }

  async listNextChildPosts(
    parentPostId: number,
    lastId: number,
    quantity: number,
  ): Promise<PostsEntity[]> {
    try {
      const posts = await this.postRepository.listNextChildPosts(
        parentPostId,
        lastId,
        quantity,
      );
      if (!posts) {
        throw new NotFoundPostException();
      }
      return posts;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error fetching next batch of child posts',
        error: error instanceof Error ? error.message : error,
      });
      if (error instanceof NotFoundPostException) {
        throw new NotFoundPostException();
      }
      throw new PostInternalErrorException();
    }
  }
}
