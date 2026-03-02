import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { InvalidVoteException } from '../exceptions/invalid-vote-exception';

@Injectable()
export class VotePostService {
  private readonly logger = new Logger(VotePostService.name);

  constructor(private readonly postsRepository: PostRepository) {}

  async execute(
    postId: number,
    user: AuthUser,
    upvote: number,
  ): Promise<boolean> {
    this.logger.log({ message: 'Voting Post', postId, userId: user.id });
    return this.votePost(postId, user.id, upvote);
  }

  private async votePost(
    postId: number,
    userId: number,
    upvote: number,
  ): Promise<boolean> {
    try {
      if (upvote !== 0 && upvote !== 1) {
        throw new InvalidVoteException();
      }

      const post = await this.postsRepository.getPostById(postId);

      if (!post) {
        throw new NotFoundPostException();
      }

      const isUpvote = upvote === 1;

      return await this.postsRepository.votePost(postId, userId, isUpvote);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error voting post',
        postId,
        userId,
        error: error instanceof Error ? error.message : error,
      });

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundPostException
      ) {
        throw error;
      }

      throw new PostInternalErrorException();
    }
  }
}
