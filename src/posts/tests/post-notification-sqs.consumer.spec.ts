import { Test, TestingModule } from '@nestjs/testing';
import { Message } from '@aws-sdk/client-sqs';
import { PostNotificationSqsConsumer } from '../consumers/post-notification-sqs.consumer';
import { PostRepository } from '../repositories/post.repository';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { Post } from '../entities/post.entity';

describe('PostNotificationSqsConsumer', () => {
  let consumer: PostNotificationSqsConsumer;
  let postRepository: jest.Mocked<PostRepository>;
  let notificationQueueService: jest.Mocked<NotificationQueueService>;
  let logger: jest.Mocked<CustomLogger>;

  const mockPostRepository = {
    getPostById: jest.fn(),
    getUserIdsWhoCommented: jest.fn(),
  };

  const mockNotificationQueueService = {
    addNotificationJob: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostNotificationSqsConsumer,
        {
          provide: PostRepository,
          useValue: mockPostRepository,
        },
        {
          provide: NotificationQueueService,
          useValue: mockNotificationQueueService,
        },
        {
          provide: CustomLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    consumer = module.get<PostNotificationSqsConsumer>(
      PostNotificationSqsConsumer,
    );
    postRepository = module.get(PostRepository);
    notificationQueueService = module.get(NotificationQueueService);
    logger = module.get(CustomLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('handleMessage', () => {
    const mockMessage: Message = {
      MessageId: 'test-message-id',
      Body: JSON.stringify({
        postId: 1,
        commentAuthorId: 2,
        commentAuthorName: 'John Doe',
        parentId: 10,
      }),
    };

    const mockParentPost = new Post(
      10,
      new Date(),
      'Parent post content',
      5,
      'Jane Smith',
      null,
      null,
      3,
      ['tag1'],
      1,
    );

    it('should process notification successfully', async () => {
      postRepository.getPostById.mockResolvedValue(mockParentPost);
      postRepository.getUserIdsWhoCommented.mockResolvedValue([2, 3, 4]);
      notificationQueueService.addNotificationJob.mockResolvedValue(undefined);

      await consumer.handleMessage(mockMessage);

      expect(postRepository.getPostById).toHaveBeenCalledWith(10);
      expect(postRepository.getUserIdsWhoCommented).toHaveBeenCalledWith(10);
      expect(notificationQueueService.addNotificationJob).toHaveBeenCalledWith({
        title: 'Novo comentário',
        message: 'John Doe comentou em uma publicação',
        userIds: expect.arrayContaining([5, 3, 4]) as number[],
        data: {
          postId: '10',
          type: 'comment',
        },
      });
      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Post notification processed successfully',
        }),
      );
    });

    it('should not include comment author in recipients', async () => {
      postRepository.getPostById.mockResolvedValue(mockParentPost);
      postRepository.getUserIdsWhoCommented.mockResolvedValue([2, 3, 4]);
      notificationQueueService.addNotificationJob.mockResolvedValue(undefined);

      await consumer.handleMessage(mockMessage);

      const callArgs =
        notificationQueueService.addNotificationJob.mock.calls[0][0];
      expect(callArgs.userIds).not.toContain(2);
    });

    it('should include post owner in recipients', async () => {
      postRepository.getPostById.mockResolvedValue(mockParentPost);
      postRepository.getUserIdsWhoCommented.mockResolvedValue([]);
      notificationQueueService.addNotificationJob.mockResolvedValue(undefined);

      await consumer.handleMessage(mockMessage);

      const callArgs =
        notificationQueueService.addNotificationJob.mock.calls[0][0];
      expect(callArgs.userIds).toContain(5);
    });

    it('should log warning when parent post not found', async () => {
      postRepository.getPostById.mockResolvedValue(null);

      await consumer.handleMessage(mockMessage);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Parent post not found',
          parentId: 10,
        }),
      );
      expect(
        notificationQueueService.addNotificationJob,
      ).not.toHaveBeenCalled();
    });

    it('should log when no recipients found', async () => {
      const mockPostAsAuthor = new Post(
        10,
        new Date(),
        'Parent post content',
        2,
        'John Doe',
        null,
        null,
        0,
        [],
        1,
      );

      postRepository.getPostById.mockResolvedValue(mockPostAsAuthor);
      postRepository.getUserIdsWhoCommented.mockResolvedValue([2]);

      await consumer.handleMessage(mockMessage);

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No recipients for post notification',
        }),
      );
      expect(
        notificationQueueService.addNotificationJob,
      ).not.toHaveBeenCalled();
    });

    it('should throw error and log when processing fails', async () => {
      postRepository.getPostById.mockRejectedValue(new Error('Database error'));

      await expect(consumer.handleMessage(mockMessage)).rejects.toThrow(
        'Database error',
      );

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to process post notification from SQS',
          error: 'Database error',
        }),
      );
    });

    it('should handle undefined messageId', async () => {
      const messageWithoutId: Message = {
        Body: mockMessage.Body,
      };

      postRepository.getPostById.mockResolvedValue(mockParentPost);
      postRepository.getUserIdsWhoCommented.mockResolvedValue([3]);
      notificationQueueService.addNotificationJob.mockResolvedValue(undefined);

      await consumer.handleMessage(messageWithoutId);

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'unknown',
        }),
      );
    });

    it('should handle invalid JSON in message body', async () => {
      const invalidMessage: Message = {
        MessageId: 'test-id',
        Body: 'invalid json',
      };

      await expect(consumer.handleMessage(invalidMessage)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('onError', () => {
    it('should log error', () => {
      const error = new Error('SQS consumer error');

      consumer.onError(error);

      expect(logger.error).toHaveBeenCalledWith({
        message: 'SQS post notification consumer error',
        error: 'SQS consumer error',
      });
    });
  });

  describe('onProcessingError', () => {
    it('should log processing error with messageId', () => {
      const error = new Error('Processing error');
      const message: Message = {
        MessageId: 'test-message-id',
      };

      consumer.onProcessingError(error, message);

      expect(logger.error).toHaveBeenCalledWith({
        message: 'SQS post notification processing error',
        messageId: 'test-message-id',
        error: 'Processing error',
      });
    });
  });
});
