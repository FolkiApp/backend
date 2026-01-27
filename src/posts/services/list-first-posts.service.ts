import { Injectable, Logger } from '@nestjs/common';
import { PostsRepository } from '../repositories/posts.repository';
import { PostsEntity } from '../entities/posts.entity';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-posts.exception';

@Injectable()
export class ListFirstPostsService {
  private readonly logger = new Logger(ListFirstPostsService.name);

  constructor(private readonly postRepository: PostsRepository) {}

  async execute(quantity: number): Promise<PostsEntity[]> {
    this.logger.log({ message: 'Listing first batch of Posts' });
    return this.listFirstPosts(quantity);
  }
  async listFirstPosts(quantity: number): Promise<PostsEntity[]> {
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
}
