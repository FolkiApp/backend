import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from '../email.controller';
import { EmailQueueService } from '../services/email-queue.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SendEmailDto } from '../dto/send-email.dto';

describe('EmailController', () => {
  let controller: EmailController;

  const mockEmailQueueService = {
    addEmailJob: jest.fn(),
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
      controllers: [EmailController],
      providers: [
        {
          provide: EmailQueueService,
          useValue: mockEmailQueueService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should enqueue email successfully', async () => {
      const dto: SendEmailDto = {
        userIds: [1, 2, 3],
        subject: 'Bem-vindo ao Folki',
        html: '<h1>Olá!</h1>',
      };

      mockEmailQueueService.addEmailJob.mockResolvedValue(undefined);

      const result = await controller.sendEmail(dto);

      expect(result).toBeUndefined();
      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Enqueuing email',
          userIdsCount: 3,
          subject: 'Bem-vindo ao Folki',
        }),
      );
      expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(dto);
    });

    it('should enqueue email with optional idempotencyId', async () => {
      const dto: SendEmailDto = {
        userIds: [1, 2, 3],
        subject: 'Bem-vindo ao Folki',
        html: '<h1>Olá!</h1>',
        idempotencyId: 'custom-id-123',
      };

      mockEmailQueueService.addEmailJob.mockResolvedValue(undefined);

      await controller.sendEmail(dto);

      expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(dto);
    });

    it('should handle empty userIds array', async () => {
      const dto: SendEmailDto = {
        userIds: [],
        subject: 'Bem-vindo ao Folki',
        html: '<h1>Olá!</h1>',
      };

      mockEmailQueueService.addEmailJob.mockResolvedValue(undefined);

      await controller.sendEmail(dto);

      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Enqueuing email',
          userIdsCount: 0,
        }),
      );
      expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(dto);
    });

    it('should propagate error when queue service fails', async () => {
      const dto: SendEmailDto = {
        userIds: [1, 2, 3],
        subject: 'Bem-vindo ao Folki',
        html: '<h1>Olá!</h1>',
      };
      const error = new Error('Queue service error');

      mockEmailQueueService.addEmailJob.mockRejectedValue(error);

      await expect(controller.sendEmail(dto)).rejects.toThrow(
        'Queue service error',
      );
      expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(dto);
    });
  });
});
