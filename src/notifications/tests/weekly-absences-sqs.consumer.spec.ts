import { Test, TestingModule } from '@nestjs/testing';
import type { Message } from '@aws-sdk/client-sqs';
import { WeeklyAbsencesSqsConsumer } from '../consumers/weekly-absences-sqs.consumer';
import { UserRepository } from '../../users/repositories/user.repository';
import { NotificationQueueService } from '../services/notification-queue.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('WeeklyAbsencesSqsConsumer', () => {
  let consumer: WeeklyAbsencesSqsConsumer;

  const mockUserRepository = {
    findAllActive: jest.fn(),
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
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyAbsencesSqsConsumer,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
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

    consumer = module.get<WeeklyAbsencesSqsConsumer>(WeeklyAbsencesSqsConsumer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should process weekly absences message successfully', async () => {
    // Mock data durante semestre ativo de ambas universidades
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15)); // 15 de maio - durante ambos semestres

    const message = createMockMessage();
    const users = [
      { id: 1, email: 'user1@test.com', universityId: 1 },
      { id: 2, email: 'user2@test.com', universityId: 1 },
      { id: 3, email: 'user3@test.com', universityId: 2 },
    ];

    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Processing weekly absences notification from SQS',
        messageId: 'test-message-id-123',
      }) as Record<string, unknown>,
    );

    expect(mockUserRepository.findAllActive).toHaveBeenCalled();

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(1);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Não esqueça!',
        message:
          'A semana acabou! Não esqueça de marcar as suas faltas da semana no Folki!',
        userIds: [1, 2, 3],
      }) as Record<string, unknown>,
    );

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Weekly absences notifications sent successfully',
        totalNotifications: 3,
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });

  it('should handle empty user list gracefully', async () => {
    const message = createMockMessage();
    mockUserRepository.findAllActive.mockResolvedValue([]);

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No active users found',
        messageId: 'test-message-id-123',
      }) as Record<string, unknown>,
    );

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).not.toHaveBeenCalled();
  });

  it('should process large user list in batches', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15)); // Durante o semestre

    const message = createMockMessage();
    const users = Array.from({ length: 450 }, (_, i) => ({
      id: i + 1,
      email: `user${i + 1}@test.com`,
      universityId: 1,
    }));

    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    const handlePromise = consumer.handleMessage(message);

    // Avançar timers para processar delays entre batches
    await jest.advanceTimersByTimeAsync(3000);

    await handlePromise;

    // Deve processar em 3 batches (200 + 200 + 50)
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(3);

    // Verificar primeiro batch (200 usuários)
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userIds: expect.arrayContaining([1, 2, 200]) as number[],
      }) as Record<string, unknown>,
    );

    // Verificar segundo batch (200 usuários)
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userIds: expect.arrayContaining([201, 202, 400]) as number[],
      }) as Record<string, unknown>,
    );

    // Verificar terceiro batch (50 usuários)
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        userIds: expect.arrayContaining([401, 402, 450]) as number[],
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });

  it('should continue processing remaining batches if one batch fails', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15)); // Durante o semestre

    const message = createMockMessage();
    const users = Array.from({ length: 450 }, (_, i) => ({
      id: i + 1,
      email: `user${i + 1}@test.com`,
      universityId: 1,
    }));

    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob
      .mockResolvedValueOnce(undefined) // Batch 1 success
      .mockRejectedValueOnce(new Error('Notification failed')) // Batch 2 fails
      .mockResolvedValueOnce(undefined); // Batch 3 success

    const handlePromise = consumer.handleMessage(message);

    // Avançar timers para processar delays entre batches
    await jest.advanceTimersByTimeAsync(3000);

    await handlePromise;

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(3);

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error processing batch, continuing with next batch',
        batchNumber: 2,
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });

  it('should log error and throw when repository fails', async () => {
    const message = createMockMessage();
    const error = new Error('Database error');

    mockUserRepository.findAllActive.mockRejectedValue(error);

    await expect(consumer.handleMessage(message)).rejects.toThrow(
      'Database error',
    );

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to process weekly absences from SQS',
        messageId: 'test-message-id-123',
        error: 'Database error',
      }) as Record<string, unknown>,
    );
  });

  it('should send notification with correct message format', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15)); // Durante o semestre

    const message = createMockMessage();
    const users = [{ id: 1, email: 'user1@test.com', universityId: 1 }];

    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith({
      title: 'Não esqueça!',
      message:
        'A semana acabou! Não esqueça de marcar as suas faltas da semana no Folki!',
      userIds: [1],
    });

    jest.useRealTimers();
  });

  it('should filter out users with inactive semester', async () => {
    const message = createMockMessage();
    // Mock data atual fora do período de semestre
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 15)); // 15 de janeiro - antes do início

    const users = [
      { id: 1, email: 'user1@test.com', universityId: 1 }, // Semestre começa em 23/03
      { id: 2, email: 'user2@test.com', universityId: 2 }, // Semestre começa em 09/04
    ];

    mockUserRepository.findAllActive.mockResolvedValue(users);

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No active users found',
      }) as Record<string, unknown>,
    );

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should only send to users with active semester', async () => {
    const message = createMockMessage();
    // Mock data atual durante o semestre da universidade 1 e 3, mas antes do início da 2
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 1)); // 1 de março - USP e UNICAMP ativos, UFSCar ainda não começou

    const users = [
      { id: 1, email: 'user1@test.com', universityId: 1 }, // USP - ativo (23/fev - 04/jul)
      { id: 2, email: 'user2@test.com', universityId: 2 }, // UFSCar - inativo (09/mar - 18/jul)
      { id: 3, email: 'user3@test.com', universityId: 3 }, // UNICAMP - ativo (23/fev - 08/jul)
    ];

    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Active users fetched and filtered by semester',
        totalUsers: 3,
        usersWithActiveSemester: 2,
        filteredOut: 1,
        usersWithoutUniversity: 0,
      }) as Record<string, unknown>,
    );

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userIds: [1, 3], // USP e UNICAMP
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });

  it('should skip users from universities without configured semester dates', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15)); // Durante o semestre

    const message = createMockMessage();
    const users = [
      { id: 1, email: 'user1@test.com', universityId: 1 },
      { id: 2, email: 'user2@test.com', universityId: 999 }, // Universidade não configurada
    ];

    mockUserRepository.findAllActive.mockResolvedValue(users);
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(mockCustomLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'University semester dates not configured, skipping user',
        universityId: 999,
      }) as Record<string, unknown>,
    );

    jest.useRealTimers();
  });
});
