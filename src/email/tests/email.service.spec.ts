import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../services/email.service';
import { EmailSendException } from '../exceptions/email-send.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  SendEmailCommand: jest
    .fn()
    .mockImplementation((input: Record<string, unknown>) => ({ input })),
}));

import { SendEmailCommand } from '@aws-sdk/client-sesv2';

describe('EmailService', () => {
  let service: EmailService;

  const mockCustomLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const params = {
    to: ['a@dac.unicamp.br', 'b@dac.unicamp.br'],
    subject: 'Bem-vindo ao Folki',
    html: '<h1>Olá!</h1>',
  };

  const createService = async (): Promise<EmailService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    return module.get<EmailService>(EmailService);
  };

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.AWS_SES_FROM_EMAIL;
  });

  describe('when sender is configured', () => {
    beforeEach(async () => {
      process.env.AWS_SES_FROM_EMAIL = 'no-reply@folki.com.br';
      service = await createService();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should send email via SES', async () => {
      mockSend.mockResolvedValue(undefined);

      await service.sendEmail(params);

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          FromEmailAddress: 'no-reply@folki.com.br',
          Destination: { ToAddresses: params.to },
          Content: expect.objectContaining({
            Simple: expect.objectContaining({
              Subject: { Data: params.subject, Charset: 'UTF-8' },
            }) as Record<string, unknown>,
          }) as Record<string, unknown>,
        }),
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockCustomLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email sent successfully to 2 recipient(s)',
        }),
      );
    });

    it('should include replyTo when provided', async () => {
      mockSend.mockResolvedValue(undefined);

      await service.sendEmail({ ...params, replyTo: 'contato@folki.com.br' });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ReplyToAddresses: ['contato@folki.com.br'],
        }),
      );
    });

    it('should skip sending when no recipients provided', async () => {
      await service.sendEmail({ ...params, to: [] });

      expect(mockSend).not.toHaveBeenCalled();
      expect(mockCustomLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No recipients provided, skipping email',
        }),
      );
    });

    it('should throw EmailSendException when SES fails', async () => {
      mockSend.mockRejectedValue(new Error('SES failure'));

      await expect(service.sendEmail(params)).rejects.toThrow(
        EmailSendException,
      );

      expect(mockCustomLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to send email',
          error: 'SES failure',
        }),
      );
    });
  });

  describe('when sender is not configured', () => {
    beforeEach(async () => {
      delete process.env.AWS_SES_FROM_EMAIL;
      service = await createService();
    });

    it('should warn on construction', () => {
      expect(mockCustomLogger.warn).toHaveBeenCalledWith(
        'AWS SES sender (AWS_SES_FROM_EMAIL) not configured. Emails will not be sent.',
      );
    });

    it('should skip sending and not call SES', async () => {
      await service.sendEmail(params);

      expect(mockSend).not.toHaveBeenCalled();
      expect(mockCustomLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'AWS SES sender not configured. Skipping email.',
        }),
      );
    });
  });
});
