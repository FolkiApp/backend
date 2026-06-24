import { Injectable, Logger } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';

@Injectable()
export class CountNewPostsService {
  private readonly logger = new Logger(CountNewPostsService.name);

  constructor(private readonly postRepository: PostRepository) {}

  async execute(universityId: number | null): Promise<number> {
    this.logger.log({ message: 'Counting new posts from last 24h', universityId });

    try {
      return await this.postRepository.countPostsInLast24Hours(universityId);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error counting new posts from last 24h',
        universityId,
        error: error instanceof Error ? error.message : error,
      });

      throw new PostInternalErrorException();
    }
  }
}
