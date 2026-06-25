import { Test, TestingModule } from '@nestjs/testing';
import { SqsService } from '@ssut/nestjs-sqs';
import { NotificationQueueService } from '../services/notification-queue.service';
import { PipoNotificationService } from '../services/pipo-notification.service';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { NotificationRepository } from '../repositories/notification.repository';

describe('NotificationQueueService', () => {
  let service: NotificationQueueService;

  const mockSqsService = {
    send: jest.fn(),
  };

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

  const mockNotificationRepository = {
    createNotification: jest.fn(),
  };

  const mockDto: SendNotificationDto = {
    title: 'Test Notification',
    message: 'Test message',
    userIds: [1, 2, 3],
  };

  describe('with SQS configured', () => {
    beforeEach(async () => {
      process.env.AWS_SQS_NOTIFICATION_QUEUE_URL =
        'https://sqs.us-east-1.amazonaws.com/123456789/test-queue';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationQueueService,
          {
            provide: SqsService,
            useValue: mockSqsService,
          },
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
          {
            provide: NotificationRepository,
            useValue: mockNotificationRepository,
          },
        ],
      }).compile();

      service = module.get<NotificationQueueService>(NotificationQueueService);
      mockNotificationRepository.createNotification.mockResolvedValue(
        undefined,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
      delete process.env.AWS_SQS_NOTIFICATION_QUEUE_URL;
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should send notification to SQS when SQS is configured', async () => {
      mockSqsService.send.mockResolvedValue(undefined);

      await service.addNotificationJob(mockDto);

      expect(mockSqsService.send).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          body: expect.objectContaining({
            title: mockDto.title,
            message: mockDto.message,
            userIds: mockDto.userIds,
            idempotencyId: expect.any(String) as string,
          }) as Record<string, unknown>,
          delaySeconds: 0,
          messageAttributes: expect.objectContaining({
            idempotencyId: {
              DataType: 'String',
              StringValue: expect.any(String) as string,
            },
          }) as Record<string, unknown>,
        }) as Record<string, unknown>,
      );
      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Notification sent to SQS',
          userIdsCount: 3,
        }),
      );
    });

    it('should use provided idempotencyId when available', async () => {
      const dtoWithId = { ...mockDto, idempotencyId: 'custom-id-123' };
      mockSqsService.send.mockResolvedValue(undefined);

      await service.addNotificationJob(dtoWithId);

      expect(mockSqsService.send).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          id: 'custom-id-123',
          body: expect.objectContaining({
            idempotencyId: 'custom-id-123',
          }) as Record<string, unknown>,
          messageAttributes: expect.objectContaining({
            idempotencyId: {
              DataType: 'String',
              StringValue: 'custom-id-123',
            },
          }) as Record<string, unknown>,
        }) as Record<string, unknown>,
      );
    });

    it('should log error and throw when SQS fails', async () => {
      const error = new Error('SQS error');
      mockSqsService.send.mockRejectedValue(error);

      await expect(service.addNotificationJob(mockDto)).rejects.toThrow(
        'SQS error',
      );

      expect(mockCustomLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to send notification to SQS',
          error: 'SQS error',
        }),
      );
    });

    it('should save notification and link users in the database', async () => {
      mockSqsService.send.mockResolvedValue(undefined);
      mockNotificationRepository.createNotification.mockResolvedValue(
        undefined,
      );

      await service.addNotificationJob(mockDto);

      expect(
        mockNotificationRepository.createNotification,
      ).toHaveBeenCalledWith(mockDto.title, mockDto.message, mockDto.userIds);
    });

    it('should log error when database save fails, but not block SQS queuing', async () => {
      mockSqsService.send.mockResolvedValue(undefined);
      mockNotificationRepository.createNotification.mockRejectedValue(
        new Error('DB error'),
      );

      await service.addNotificationJob(mockDto);

      expect(mockCustomLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to save notification to database',
          error: 'DB error',
        }),
      );
      expect(mockSqsService.send).toHaveBeenCalled();
    });
  });

  describe('without SQS configured (synchronous mode)', () => {
    beforeEach(async () => {
      delete process.env.AWS_SQS_NOTIFICATION_QUEUE_URL;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationQueueService,
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
          {
            provide: NotificationRepository,
            useValue: mockNotificationRepository,
          },
        ],
      }).compile();

      service = module.get<NotificationQueueService>(NotificationQueueService);
      mockNotificationRepository.createNotification.mockResolvedValue(
        undefined,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should log warning when SQS is not configured', () => {
      expect(mockCustomLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'SQS not configured, notifications will be sent synchronously',
        }),
      );
    });

    it('should send notification synchronously when SQS is not configured', async () => {
      const playerIds = ['player-1', 'player-2', 'player-3'];
      mockUserSubjectsRepository.getNotificationIdsByUserIds.mockResolvedValue(
        playerIds,
      );
      mockPipoNotificationService.sendNotification.mockResolvedValue(undefined);

      await service.addNotificationJob(mockDto);

      expect(
        mockUserSubjectsRepository.getNotificationIdsByUserIds,
      ).toHaveBeenCalledWith(mockDto.userIds);
      expect(mockPipoNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockDto.title,
          message: mockDto.message,
          playerIds,
          idempotencyId: expect.any(String) as string,
        }) as Record<string, unknown>,
      );
      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Notification sent synchronously (SQS not configured)',
          recipientsCount: 3,
        }),
      );
    });

    it('should log warning when no notification IDs found in synchronous mode', async () => {
      mockUserSubjectsRepository.getNotificationIdsByUserIds.mockResolvedValue(
        [],
      );

      await service.addNotificationJob(mockDto);

      expect(mockCustomLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No notification IDs found for users (synchronous)',
          userIdsCount: 3,
        }),
      );
      expect(
        mockPipoNotificationService.sendNotification,
      ).not.toHaveBeenCalled();
    });

    it('should log error and throw when synchronous notification fails', async () => {
      const error = new Error('Notification service error');
      mockUserSubjectsRepository.getNotificationIdsByUserIds.mockResolvedValue([
        'player-1',
      ]);
      mockPipoNotificationService.sendNotification.mockRejectedValue(error);

      await expect(service.addNotificationJob(mockDto)).rejects.toThrow(
        'Notification service error',
      );

      expect(mockCustomLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to send notification synchronously',
          error: 'Notification service error',
        }),
      );
    });
  });
});
