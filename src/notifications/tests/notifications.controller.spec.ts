import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../notifications.controller';
import { NotificationQueueService } from '../services/notification-queue.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SendNotificationDto } from '../dto/send-notification.dto';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationQueueService = {
    addNotificationJob: jest.fn(),
  };

  const mockCustomLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationQueueService,
          useValue: mockNotificationQueueService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const dto: SendNotificationDto = {
        title: 'Test Notification',
        message: 'Test message content',
        userIds: [1, 2, 3],
      };

      mockNotificationQueueService.addNotificationJob.mockResolvedValue(
        undefined,
      );

      const result = await controller.sendNotification(dto);

      expect(result).toBeUndefined();
      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Sending notification',
          userIdsCount: 3,
        }),
      );
      expect(
        mockNotificationQueueService.addNotificationJob,
      ).toHaveBeenCalledWith(dto);
    });

    it('should send notification with optional idempotencyId', async () => {
      const dto: SendNotificationDto = {
        title: 'Test Notification',
        message: 'Test message content',
        userIds: [1, 2, 3],
        idempotencyId: 'custom-id-123',
      };

      mockNotificationQueueService.addNotificationJob.mockResolvedValue(
        undefined,
      );

      await controller.sendNotification(dto);

      expect(
        mockNotificationQueueService.addNotificationJob,
      ).toHaveBeenCalledWith(dto);
    });

    it('should handle empty userIds array', async () => {
      const dto: SendNotificationDto = {
        title: 'Test Notification',
        message: 'Test message content',
        userIds: [],
      };

      mockNotificationQueueService.addNotificationJob.mockResolvedValue(
        undefined,
      );

      await controller.sendNotification(dto);

      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Sending notification',
          userIdsCount: 0,
        }),
      );
      expect(
        mockNotificationQueueService.addNotificationJob,
      ).toHaveBeenCalledWith(dto);
    });

    it('should propagate error when queue service fails', async () => {
      const dto: SendNotificationDto = {
        title: 'Test Notification',
        message: 'Test message content',
        userIds: [1, 2, 3],
      };
      const error = new Error('Queue service error');

      mockNotificationQueueService.addNotificationJob.mockRejectedValue(error);

      await expect(controller.sendNotification(dto)).rejects.toThrow(
        'Queue service error',
      );
      expect(
        mockNotificationQueueService.addNotificationJob,
      ).toHaveBeenCalledWith(dto);
    });
  });
});
