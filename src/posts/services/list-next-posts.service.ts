import { Injectable, Logger } from '@nestjs/common';
import { PostsRepository } from '../repositories/posts.repository';
import { PostsEntity } from '../entities/posts.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';

@Injectable()
export class ListNextPostsService {
  private readonly logger = new Logger(ListNextPostsService.name);

  constructor(private readonly postRepository: PostsRepository) {}

  async execute(lastId: number, quantity: number): Promise<PostsEntity[]> {
    this.logger.log({ message: 'Listing next batch of Posts' });
    return this.listNextPosts(lastId, quantity);
  }
  async listNextPosts(
    lastId: number,
    quantity: number,
  ): Promise<PostsEntity[]> {
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
