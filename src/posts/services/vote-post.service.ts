import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '../../common/guards/auth.guard';
import { PostRepository } from '../repositories/post.repository';
import { PostInternalErrorException } from '../exceptions/post-internal-error.exception';
import { NotFoundPostException } from '../exceptions/not-found-post.exception';
import { InvalidVoteException } from '../exceptions/invalid-vote-exception';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';

@Injectable()
export class VotePostService {
  private readonly logger = new Logger(VotePostService.name);
  private readonly UPVOTE_MILESTONES = [2, 6, 11, 21, 51, 101];

  constructor(
    private readonly postsRepository: PostRepository,
    private readonly notificationQueueService: NotificationQueueService,
  ) {}

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
      const previousUpvotes = post.upvotes;

      await this.postsRepository.votePost(postId, userId, isUpvote);

      await this.checkAndSendUpvoteMilestoneNotification(
        postId,
        post.userId,
        post.parentId,
        previousUpvotes,
        isUpvote,
        userId,
      );

      return true;
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

  private async checkAndSendUpvoteMilestoneNotification(
    postId: number,
    postOwnerId: number,
    parentId: number | null,
    previousUpvotes: number,
    isUpvote: boolean,
    userId: number,
  ): Promise<void> {
    if (!isUpvote || userId === postOwnerId) return;

    const newUpvotes = previousUpvotes + 1;

    const crossedMilestone = this.UPVOTE_MILESTONES.find(
      (milestone) => previousUpvotes < milestone && newUpvotes >= milestone,
    );

    if (!crossedMilestone) return;

    const isFirstMilestone = crossedMilestone === this.UPVOTE_MILESTONES[0];
    const isComment = parentId !== null;
    if (isFirstMilestone && isComment) return;

    try {
      const targetPostId = parentId || postId;
      const milestoneDisplay = crossedMilestone - 1;
      const upvoteText = milestoneDisplay === 1 ? 'upvote' : 'upvotes';

      await this.notificationQueueService.addNotificationJob({
        title: `${milestoneDisplay} ${upvoteText}!`,
        message: isComment
          ? `Seu comentário atingiu ${milestoneDisplay} ${upvoteText} ;)`
          : `Sua publicação atingiu ${milestoneDisplay} ${upvoteText} ;)`,
        userIds: [postOwnerId],
        webUrl: `https://web.folki.com.br/#/Board?postId=${targetPostId}`,
        appUrl: `folki://Board?postId=${targetPostId}`,
      });

      this.logger.log({
        message: 'Upvote milestone notification sent',
        postId,
        milestone: crossedMilestone,
        actualUpvotes: milestoneDisplay,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to send upvote milestone notification',
        postId,
        milestone: crossedMilestone,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
