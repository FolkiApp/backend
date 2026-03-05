import { Injectable, Logger } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { Post } from '../entities/post.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';

@Injectable()
export class ListFirstPostService {
  private readonly logger = new Logger(ListFirstPostService.name);

  constructor(private readonly postRepository: PostRepository) {}

  async execute(
    quantity: number,
    universityId: number | null,
    userId: number,
    lastId?: number,
    tags?: string[],
  ): Promise<Post[]> {
    this.logger.log({ message: 'Listing batch of Posts' });
    if (!lastId) {
      return this.listFirstPosts(quantity, universityId, userId, tags);
    } else {
      return this.listNextPosts(lastId, quantity, universityId, userId, tags);
    }
  }
  async listFirstPosts(
    quantity: number,
    universityId: number | null,
    userId: number,
    tags?: string[],
  ): Promise<Post[]> {
    try {
      const posts = await this.postRepository.listPosts(
        quantity,
        null,
        tags,
        userId,
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
    userId: number,
    tags?: string[],
  ): Promise<Post[]> {
    try {
      const posts = await this.postRepository.listNextPosts(
        lastId,
        quantity,
        universityId,
        tags,
        userId,
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
