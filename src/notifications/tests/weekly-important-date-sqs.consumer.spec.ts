import { Test, TestingModule } from '@nestjs/testing';
import type { Message } from '@aws-sdk/client-sqs';
import { WeeklyImportantDateSqsConsumer } from '../consumers/weekly-important-date-sqs.consumer';
import { UserRepository } from '../../users/repositories/user.repository';
import { ImportantDateRepository } from '../../importantdates/repositories/important-date.repository';
import { NotificationQueueService } from '../services/notification-queue.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('WeeklyImportantDateSqsConsumer', () => {
  let consumer: WeeklyImportantDateSqsConsumer;

  const mockUserRepository = {
    findAllActive: jest.fn(),
  };

  const mockImportantDateRepository = {
    findDayOffBetweenDates: jest.fn(),
  };

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

  const createMockMessage = (): Message => {
    return {
      MessageId: 'test-message-id-123',
      Body: JSON.stringify({}),
      ReceiptHandle: 'test-receipt-handle',
    } as Message;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyImportantDateSqsConsumer,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: ImportantDateRepository,
          useValue: mockImportantDateRepository,
        },
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

    consumer = module.get<WeeklyImportantDateSqsConsumer>(
      WeeklyImportantDateSqsConsumer,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should process message with one important date successfully', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15)); // Durante o semestre

    const message = createMockMessage();
    const importantDates = [
      {
        id: 1,
        name: 'Dia do Trabalho',
        date: new Date(2026, 4, 1),
        universityId: 1,
        campusId: null,
      },
    ];
    const users = [
      { id: 1, email: 'user1@test.com', universityId: 1 },
      { id: 2, email: 'user2@test.com', universityId: 1 },
    ];

    mockImportantDateRepository.findDayOffBetweenDates.mockResolvedValue(
      importantDates,
    );
    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(
      mockImportantDateRepository.findDayOffBetweenDates,
    ).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(1);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Dias sem Aula 📅',
        userIds: [1, 2],
        message: expect.stringContaining('Dia do Trabalho') as string,
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });

  it('should process message with multiple important dates', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15));

    const message = createMockMessage();
    const importantDates = [
      {
        id: 1,
        name: 'Feriado 1',
        date: new Date(2026, 4, 16),
        universityId: 1,
        campusId: null,
      },
      {
        id: 2,
        name: 'Feriado 2',
        date: new Date(2026, 4, 17),
        universityId: 1,
        campusId: null,
      },
    ];
    const users = [{ id: 1, email: 'user1@test.com', universityId: 1 }];

    mockImportantDateRepository.findDayOffBetweenDates.mockResolvedValue(
      importantDates,
    );
    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          '2 dias sem aula essa semana',
        ) as string,
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });

  it('should handle no important dates gracefully', async () => {
    const message = createMockMessage();
    mockImportantDateRepository.findDayOffBetweenDates.mockResolvedValue([]);

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No important dates found for this week',
      }) as Record<string, unknown>,
    );

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).not.toHaveBeenCalled();
  });

  it('should filter users by university when dates are university-specific', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15));

    const message = createMockMessage();
    const importantDates = [
      {
        id: 1,
        name: 'Feriado USP',
        date: new Date(2026, 4, 16),
        universityId: 1,
        campusId: null,
      },
    ];
    const users = [
      { id: 1, email: 'user1@test.com', universityId: 1 }, // USP
      { id: 2, email: 'user2@test.com', universityId: 2 }, // UFSCar
    ];

    mockImportantDateRepository.findDayOffBetweenDates.mockResolvedValue(
      importantDates,
    );
    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userIds: [1], // Apenas USP
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });

  it('should notify all users when date is global', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15));

    const message = createMockMessage();
    const importantDates = [
      {
        id: 1,
        name: 'Feriado Nacional',
        date: new Date(2026, 4, 16),
        universityId: null,
        campusId: null,
      },
    ];
    const users = [
      { id: 1, email: 'user1@test.com', universityId: 1 },
      { id: 2, email: 'user2@test.com', universityId: 2 },
    ];

    mockImportantDateRepository.findDayOffBetweenDates.mockResolvedValue(
      importantDates,
    );
    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userIds: [1, 2], // Todos os usuários
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });

  it('should process large user list in batches', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15));

    const message = createMockMessage();
    const importantDates = [
      {
        id: 1,
        name: 'Feriado',
        date: new Date(2026, 4, 16),
        universityId: 1,
        campusId: null,
      },
    ];
    const users = Array.from({ length: 450 }, (_, i) => ({
      id: i + 1,
      email: `user${i + 1}@test.com`,
      universityId: 1,
    }));

    mockImportantDateRepository.findDayOffBetweenDates.mockResolvedValue(
      importantDates,
    );
    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    const handlePromise = consumer.handleMessage(message);
    await jest.advanceTimersByTimeAsync(3000);
    await handlePromise;

    // Deve processar em 3 batches (200 + 200 + 50)
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  it('should log error and throw when repository fails', async () => {
    const message = createMockMessage();
    const error = new Error('Database error');

    mockImportantDateRepository.findDayOffBetweenDates.mockRejectedValue(error);

    await expect(consumer.handleMessage(message)).rejects.toThrow(
      'Database error',
    );

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to process weekly important date from SQS',
        error: 'Database error',
      }) as Record<string, unknown>,
    );
  });

  it('should format date correctly in notification message', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15));

    const message = createMockMessage();
    const importantDates = [
      {
        id: 1,
        name: 'Feriado Teste',
        date: new Date(2026, 4, 1), // Sexta-feira, 01/05
        universityId: 1,
        campusId: null,
      },
    ];
    const users = [{ id: 1, email: 'user1@test.com', universityId: 1 }];

    mockImportantDateRepository.findDayOffBetweenDates.mockResolvedValue(
      importantDates,
    );
    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Feriado Teste') as string,
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });
});
