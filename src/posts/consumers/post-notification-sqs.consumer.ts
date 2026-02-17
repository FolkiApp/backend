import { Injectable } from '@nestjs/common';
import { SqsMessageHandler, SqsConsumerEventHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { PostRepository } from '../repositories/post.repository';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';

interface PostNotificationMessage {
  postId: number;
  commentAuthorId: number;
  commentAuthorName: string;
  parentId: number;
}

@Injectable()
export class PostNotificationSqsConsumer {
  private readonly logger: CustomLogger;

  constructor(
    private readonly postRepository: PostRepository,
    private readonly notificationQueueService: NotificationQueueService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(PostNotificationSqsConsumer.name);
  }

  @SqsMessageHandler('post-notifications-consumer', false)
  async handleMessage(message: Message) {
    try {
      const body = JSON.parse(message.Body || '{}') as PostNotificationMessage;

      this.logger.log({
        message: 'Processing post notification from SQS',
        messageId: message.MessageId,
        postId: body.postId,
        parentId: body.parentId,
      });

      const parent = await this.postRepository.getPostById(body.parentId);
      if (!parent) {
        this.logParentNotFound(message.MessageId || 'unknown', body.parentId);
        return;
      }

      const recipientIds = await this.getNotificationRecipients(
        body.parentId,
        parent.userId,
        body.commentAuthorId,
      );

      if (recipientIds.length === 0) {
        this.logNoRecipients(message.MessageId || 'unknown', body.postId);
        return;
      }

      await this.sendNotifications(
        recipientIds,
        body.commentAuthorName,
        message.MessageId || 'unknown',
        body.postId,
        body.parentId,
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to process post notification from SQS',
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async getNotificationRecipients(
    parentId: number,
    postOwnerId: number,
    commentAuthorId: number,
  ): Promise<number[]> {
    const commentersIds =
      await this.postRepository.getUserIdsWhoCommented(parentId);

    const recipientIds = new Set<number>();

    if (postOwnerId !== commentAuthorId) {
      recipientIds.add(postOwnerId);
    }

    commentersIds.forEach((id) => {
      if (id !== commentAuthorId) {
        recipientIds.add(id);
      }
    });

    return Array.from(recipientIds);
  }

  private async sendNotifications(
    recipientIds: number[],
    commentAuthorName: string,
    messageId: string,
    postId: number,
    parentId: number,
  ): Promise<void> {
    await this.notificationQueueService.addNotificationJob({
      title: 'Novo comentário',
      message: `${commentAuthorName} comentou em uma publicação`,
      userIds: recipientIds,
      data: {
        postId: parentId.toString(),
        type: 'comment',
      },
      url: `https://web.folki.com.br/#/Board?postId=${parentId}`,
      separateWebMobile: true,
    });

    this.logger.log({
      message: 'Post notification processed successfully',
      messageId,
      postId,
      recipientsCount: recipientIds.length,
    });
  }

  private logParentNotFound(messageId: string, parentId: number): void {
    this.logger.warn({
      message: 'Parent post not found',
      messageId,
      parentId,
    });
  }

  private logNoRecipients(messageId: string, postId: number): void {
    this.logger.log({
      message: 'No recipients for post notification',
      messageId,
      postId,
    });
  }

  @SqsConsumerEventHandler('post-notifications-consumer', 'error')
  onError(error: Error) {
    this.logger.error({
      message: 'SQS post notification consumer error',
      error: error.message,
    });
  }

  @SqsConsumerEventHandler('post-notifications-consumer', 'processing_error')
  onProcessingError(error: Error, message: Message) {
    this.logger.error({
      message: 'SQS post notification processing error',
      messageId: message.MessageId,
      error: error.message,
    });
  }
}
