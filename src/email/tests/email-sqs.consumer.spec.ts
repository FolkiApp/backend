import { Test, TestingModule } from '@nestjs/testing';
import type { Message } from '@aws-sdk/client-sqs';
import { EmailSqsConsumer } from '../consumers/email-sqs.consumer';
import { EmailService } from '../services/email.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { SendEmailDto } from '../dto/send-email.dto';

describe('EmailSqsConsumer', () => {
  let consumer: EmailSqsConsumer;

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockUserRepository = {
    findEmailsByIds: jest.fn(),
  };

  const mockCustomLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const createMockMessage = (body: SendEmailDto): Message => {
    return {
      MessageId: 'test-message-id-123',
      Body: JSON.stringify(body),
      ReceiptHandle: 'test-receipt-handle',
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailSqsConsumer,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    consumer = module.get<EmailSqsConsumer>(EmailSqsConsumer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should process email message successfully', async () => {
    const messageBody: SendEmailDto = {
      userIds: [1, 2, 3],
      subject: 'Bem-vindo ao Folki',
      html: '<h1>Olá!</h1>',
      idempotencyId: 'test-idempotency-id',
    };
    const message = createMockMessage(messageBody);
    const emails = ['a@dac.unicamp.br', 'b@dac.unicamp.br', 'c@dac.unicamp.br'];

    mockUserRepository.findEmailsByIds.mockResolvedValue(emails);
    mockEmailService.sendEmail.mockResolvedValue(undefined);

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Processing email from SQS',
        messageId: 'test-message-id-123',
        idempotencyId: 'test-idempotency-id',
        userIdsCount: 3,
      }),
    );

    expect(mockUserRepository.findEmailsByIds).toHaveBeenCalledWith([1, 2, 3]);

    expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
      to: emails,
      subject: 'Bem-vindo ao Folki',
      html: '<h1>Olá!</h1>',
      text: undefined,
      replyTo: undefined,
    });

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Email processed successfully from SQS',
        messageId: 'test-message-id-123',
        idempotencyId: 'test-idempotency-id',
        recipientsCount: 3,
      }),
    );
  });

  it('should log warning when no emails found', async () => {
    const messageBody: SendEmailDto = {
      userIds: [1, 2, 3],
      subject: 'Bem-vindo ao Folki',
      html: '<h1>Olá!</h1>',
      idempotencyId: 'test-idempotency-id',
    };
    const message = createMockMessage(messageBody);

    mockUserRepository.findEmailsByIds.mockResolvedValue([]);

    await consumer.handleMessage(message);

    expect(mockCustomLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No emails found for users',
        messageId: 'test-message-id-123',
        idempotencyId: 'test-idempotency-id',
        userIdsCount: 3,
      }),
    );

    expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
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
        message: 'Failed to process email from SQS',
        messageId: 'test-message-id-123',
      }),
    );
  });

  it('should log error and throw when email send fails', async () => {
    const messageBody: SendEmailDto = {
      userIds: [1, 2, 3],
      subject: 'Bem-vindo ao Folki',
      html: '<h1>Olá!</h1>',
      idempotencyId: 'test-idempotency-id',
    };
    const message = createMockMessage(messageBody);
    const error = new Error('Email service error');

    mockUserRepository.findEmailsByIds.mockResolvedValue(['a@dac.unicamp.br']);
    mockEmailService.sendEmail.mockRejectedValue(error);

    await expect(consumer.handleMessage(message)).rejects.toThrow(
      'Email service error',
    );

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to process email from SQS',
        messageId: 'test-message-id-123',
        error: 'Email service error',
      }),
    );
  });

  it('should log error and throw when user query fails', async () => {
    const messageBody: SendEmailDto = {
      userIds: [1, 2, 3],
      subject: 'Bem-vindo ao Folki',
      html: '<h1>Olá!</h1>',
      idempotencyId: 'test-idempotency-id',
    };
    const message = createMockMessage(messageBody);
    const error = new Error('Database error');

    mockUserRepository.findEmailsByIds.mockRejectedValue(error);

    await expect(consumer.handleMessage(message)).rejects.toThrow(
      'Database error',
    );

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to process email from SQS',
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
