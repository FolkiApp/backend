import { Test, TestingModule } from '@nestjs/testing';
import { SqsService } from '@ssut/nestjs-sqs';
import { EmailQueueService } from '../services/email-queue.service';
import { EmailService } from '../services/email.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SendEmailDto } from '../dto/send-email.dto';

describe('EmailQueueService', () => {
  let service: EmailQueueService;

  const mockSqsService = {
    send: jest.fn(),
  };

  const mockEmailService = {
    sendEmailToUserIds: jest.fn(),
  };

  const mockCustomLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const mockDto: SendEmailDto = {
    userIds: [1, 2, 3],
    subject: 'Bem-vindo ao Folki',
    html: '<h1>Olá!</h1>',
  };

  describe('with SQS configured', () => {
    beforeEach(async () => {
      process.env.AWS_SQS_EMAIL_QUEUE_URL =
        'https://sqs.us-east-1.amazonaws.com/123456789/EmailQueue';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailQueueService,
          {
            provide: SqsService,
            useValue: mockSqsService,
          },
          {
            provide: EmailService,
            useValue: mockEmailService,
          },
          {
            provide: CustomLogger,
            useValue: mockCustomLogger,
          },
        ],
      }).compile();

      service = module.get<EmailQueueService>(EmailQueueService);
    });

    afterEach(() => {
      jest.clearAllMocks();
      delete process.env.AWS_SQS_EMAIL_QUEUE_URL;
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should send email to SQS when SQS is configured', async () => {
      mockSqsService.send.mockResolvedValue(undefined);

      await service.addEmailJob(mockDto);

      expect(mockSqsService.send).toHaveBeenCalledWith(
        'email',
        expect.objectContaining({
          body: expect.objectContaining({
            userIds: mockDto.userIds,
            subject: mockDto.subject,
            html: mockDto.html,
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
      expect(mockEmailService.sendEmailToUserIds).not.toHaveBeenCalled();
      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email sent to SQS',
          userIdsCount: 3,
        }),
      );
    });

    it('should use provided idempotencyId when available', async () => {
      const dtoWithId = { ...mockDto, idempotencyId: 'custom-id-123' };
      mockSqsService.send.mockResolvedValue(undefined);

      await service.addEmailJob(dtoWithId);

      expect(mockSqsService.send).toHaveBeenCalledWith(
        'email',
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

      await expect(service.addEmailJob(mockDto)).rejects.toThrow('SQS error');

      expect(mockCustomLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to send email to SQS',
          error: 'SQS error',
        }),
      );
    });
  });

  describe('without SQS configured (synchronous mode)', () => {
    beforeEach(async () => {
      delete process.env.AWS_SQS_EMAIL_QUEUE_URL;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailQueueService,
          {
            provide: EmailService,
            useValue: mockEmailService,
          },
          {
            provide: CustomLogger,
            useValue: mockCustomLogger,
          },
        ],
      }).compile();

      service = module.get<EmailQueueService>(EmailQueueService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should log warning when SQS is not configured', () => {
      expect(mockCustomLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'SQS not configured, emails will be sent synchronously',
        }),
      );
    });

    it('should send email synchronously when SQS is not configured', async () => {
      const emails = [
        'a@dac.unicamp.br',
        'b@dac.unicamp.br',
        'c@dac.unicamp.br',
      ];
      mockEmailService.sendEmailToUserIds.mockResolvedValue(emails);

      await service.addEmailJob(mockDto);

      expect(mockEmailService.sendEmailToUserIds).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: mockDto.userIds,
          subject: mockDto.subject,
          html: mockDto.html,
        }) as Record<string, unknown>,
      );
      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email sent synchronously (SQS not configured)',
          recipientsCount: 3,
        }),
      );
    });

    it('should log warning when no emails found in synchronous mode', async () => {
      mockEmailService.sendEmailToUserIds.mockResolvedValue([]);

      await service.addEmailJob(mockDto);

      expect(mockCustomLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No emails found for users (synchronous)',
          userIdsCount: 3,
        }),
      );
    });

    it('should log error and throw when synchronous send fails', async () => {
      const error = new Error('Email service error');
      mockEmailService.sendEmailToUserIds.mockRejectedValue(error);

      await expect(service.addEmailJob(mockDto)).rejects.toThrow(
        'Email service error',
      );

      expect(mockCustomLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to send email synchronously',
          error: 'Email service error',
        }),
      );
    });
  });
});
