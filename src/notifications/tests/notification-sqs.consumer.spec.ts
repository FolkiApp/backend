import { Test, TestingModule } from '@nestjs/testing';
import type { Message } from '@aws-sdk/client-sqs';
import { NotificationSqsConsumer } from '../consumers/notification-sqs.consumer';
import { PipoNotificationService } from '../services/pipo-notification.service';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SendNotificationDto } from '../dto/send-notification.dto';

describe('NotificationSqsConsumer', () => {
  let consumer: NotificationSqsConsumer;

  const mockPipoNotificationService = {
    sendNotification: jest.fn(),
  };

  const mockUserSubjectsRepository = {
    getNotificationIdsByUserIds: jest.fn(),
  };

  const mockCustomLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const createMockMessage = (body: SendNotificationDto): Message => {
    return {
      MessageId: 'test-message-id-123',
      Body: JSON.stringify(body),
      ReceiptHandle: 'test-receipt-handle',
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSqsConsumer,
        {
          provide: PipoNotificationService,
          useValue: mockPipoNotificationService,
        },
        {
          provide: UserSubjectsRepository,
          useValue: mockUserSubjectsRepository,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    consumer = module.get<NotificationSqsConsumer>(NotificationSqsConsumer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should process notification message successfully', async () => {
    const messageBody: SendNotificationDto = {
      title: 'Test Notification',
      message: 'Test message',
      userIds: [1, 2, 3],
      idempotencyId: 'test-idempotency-id',
    };
    const message = createMockMessage(messageBody);
    const playerIds = ['player-1', 'player-2', 'player-3'];

    mockUserSubjectsRepository.getNotificationIdsByUserIds.mockResolvedValue(
      playerIds,
    );
    mockPipoNotificationService.sendNotification.mockResolvedValue(undefined);

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Processing notification from SQS',
        messageId: 'test-message-id-123',
        idempotencyId: 'test-idempotency-id',
        userIdsCount: 3,
      }),
    );

    expect(
      mockUserSubjectsRepository.getNotificationIdsByUserIds,
    ).toHaveBeenCalledWith([1, 2, 3]);

    expect(mockPipoNotificationService.sendNotification).toHaveBeenCalledWith({
      title: 'Test Notification',
      message: 'Test message',
      playerIds,
      idempotencyId: 'test-idempotency-id',
    });

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Notification processed successfully from SQS',
        messageId: 'test-message-id-123',
        idempotencyId: 'test-idempotency-id',
        recipientsCount: 3,
      }),
    );
  });

  it('should log warning when no player IDs found', async () => {
    const messageBody: SendNotificationDto = {
      title: 'Test Notification',
      message: 'Test message',
      userIds: [1, 2, 3],
      idempotencyId: 'test-idempotency-id',
    };
    const message = createMockMessage(messageBody);

    mockUserSubjectsRepository.getNotificationIdsByUserIds.mockResolvedValue(
      [],
    );

    await consumer.handleMessage(message);

    expect(mockCustomLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No notification IDs found for users',
        messageId: 'test-message-id-123',
        idempotencyId: 'test-idempotency-id',
        userIdsCount: 3,
      }),
    );

    expect(mockPipoNotificationService.sendNotification).not.toHaveBeenCalled();
  });

  it('should handle malformed JSON gracefully', async () => {
    const message: Message = {
      MessageId: 'test-message-id-123',
      Body: 'invalid json',
      ReceiptHandle: 'test-receipt-handle',
    };

    await expect(consumer.handleMessage(message)).rejects.toThrow();

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to process notification from SQS',
        messageId: 'test-message-id-123',
      }),
    );
  });

  it('should log error and throw when notification fails', async () => {
    const messageBody: SendNotificationDto = {
      title: 'Test Notification',
      message: 'Test message',
      userIds: [1, 2, 3],
      idempotencyId: 'test-idempotency-id',
    };
    const message = createMockMessage(messageBody);
    const error = new Error('Notification service error');

    mockUserSubjectsRepository.getNotificationIdsByUserIds.mockResolvedValue([
      'player-1',
    ]);
    mockPipoNotificationService.sendNotification.mockRejectedValue(error);

    await expect(consumer.handleMessage(message)).rejects.toThrow(
      'Notification service error',
    );

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to process notification from SQS',
        messageId: 'test-message-id-123',
        error: 'Notification service error',
      }),
    );
  });

  it('should log error and throw when user subjects query fails', async () => {
    const messageBody: SendNotificationDto = {
      title: 'Test Notification',
      message: 'Test message',
      userIds: [1, 2, 3],
      idempotencyId: 'test-idempotency-id',
    };
    const message = createMockMessage(messageBody);
    const error = new Error('Database error');

    mockUserSubjectsRepository.getNotificationIdsByUserIds.mockRejectedValue(
      error,
    );

    await expect(consumer.handleMessage(message)).rejects.toThrow(
      'Database error',
    );

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to process notification from SQS',
        messageId: 'test-message-id-123',
        error: 'Database error',
      }),
    );
  });

  it('should handle error event', () => {
    const error = new Error('SQS consumer error');

    consumer.onError(error);

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'SQS consumer error',
        error: 'SQS consumer error',
      }),
    );
  });

  it('should handle processing_error event', () => {
    const error = new Error('Processing error');
    const message: Message = {
      MessageId: 'test-message-id-123',
    };

    consumer.onProcessingError(error, message);

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'SQS message processing error',
        messageId: 'test-message-id-123',
        error: 'Processing error',
      }),
    );
  });
});
