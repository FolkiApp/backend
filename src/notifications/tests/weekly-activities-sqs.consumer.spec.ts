import { Test, TestingModule } from '@nestjs/testing';
import type { Message } from '@aws-sdk/client-sqs';
import { WeeklyActivitiesSqsConsumer } from '../consumers/weekly-activities-sqs.consumer';
import { ActivitiesRepository } from '../../activities/repositories/activities.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { NotificationQueueService } from '../services/notification-queue.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { WeeklyActivitiesSummary } from '../../activities/repositories/dto/weekly-activities-summary.dto';

describe('WeeklyActivitiesSqsConsumer', () => {
  let consumer: WeeklyActivitiesSqsConsumer;

  const mockActivitiesRepository = {
    getWeeklyActivitiesSummary: jest.fn(),
  };

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
    } as Message;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyActivitiesSqsConsumer,
        {
          provide: ActivitiesRepository,
          useValue: mockActivitiesRepository,
        },
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

    consumer = module.get<WeeklyActivitiesSqsConsumer>(
      WeeklyActivitiesSqsConsumer,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should process weekly activities message successfully', async () => {
    const message = createMockMessage();
    const summaries: WeeklyActivitiesSummary[] = [
      { userId: 1, totalActivities: 5, completedActivities: 2 },
      { userId: 2, totalActivities: 3, completedActivities: 0 },
      { userId: 3, totalActivities: 4, completedActivities: 4 },
    ];

    mockActivitiesRepository.getWeeklyActivitiesSummary.mockResolvedValue(
      summaries,
    );
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Processing weekly activities notification from SQS',
        messageId: 'test-message-id-123',
      }),
    );

    expect(
      mockActivitiesRepository.getWeeklyActivitiesSummary,
    ).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));

    // Deve enviar notificação para os 3 usuários
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(3);

    // Verificar conteúdo das notificações
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resumo Semanal - Folki',
        userIds: [1],
        message: expect.stringContaining('5 tarefas cadastradas') as string,
      }) as Record<string, unknown>,
    );

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resumo Semanal - Folki',
        userIds: [2],
        message: expect.stringContaining('3 tarefas cadastradas') as string,
      }) as Record<string, unknown>,
    );

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resumo Semanal - Folki',
        userIds: [3],
        message: expect.stringContaining('concluiu todas') as string,
      }) as Record<string, unknown>,
    );

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Weekly activities notifications sent successfully',
        totalNotifications: 3,
      }),
    );
  });

  it('should skip users with no activities', async () => {
    const message = createMockMessage();
    const summaries: WeeklyActivitiesSummary[] = [
      { userId: 1, totalActivities: 0, completedActivities: 0 },
      { userId: 2, totalActivities: 3, completedActivities: 1 },
    ];

    mockActivitiesRepository.getWeeklyActivitiesSummary.mockResolvedValue(
      summaries,
    );
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    // Deve enviar notificação apenas para usuário 2
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userIds: [2],
      }),
    );
  });

  it('should handle empty summaries gracefully', async () => {
    const message = createMockMessage();
    mockActivitiesRepository.getWeeklyActivitiesSummary.mockResolvedValue([]);

    await consumer.handleMessage(message);

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No activities found for this week',
        messageId: 'test-message-id-123',
      }),
    );

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).not.toHaveBeenCalled();
  });

  it('should generate correct message for user with no completed activities', async () => {
    const message = createMockMessage();
    const summaries: WeeklyActivitiesSummary[] = [
      { userId: 1, totalActivities: 3, completedActivities: 0 },
    ];

    mockActivitiesRepository.getWeeklyActivitiesSummary.mockResolvedValue(
      summaries,
    );
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          'Não esqueça de marcá-las como feitas',
        ) as string,
      }) as Record<string, unknown>,
    );
  });

  it('should generate correct message for user with all activities completed', async () => {
    const message = createMockMessage();
    const summaries: WeeklyActivitiesSummary[] = [
      { userId: 1, totalActivities: 5, completedActivities: 5 },
    ];

    mockActivitiesRepository.getWeeklyActivitiesSummary.mockResolvedValue(
      summaries,
    );
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Parabéns') as string,
      }) as Record<string, unknown>,
    );
  });

  it('should log error and throw when repository fails', async () => {
    const message = createMockMessage();
    const error = new Error('Database error');

    mockActivitiesRepository.getWeeklyActivitiesSummary.mockRejectedValue(
      error,
    );

    await expect(consumer.handleMessage(message)).rejects.toThrow(
      'Database error',
    );

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to process weekly activities from SQS',
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
        message: 'SQS consumer error (weekly activities)',
        error: 'SQS consumer error',
      }),
    );
  });

  it('should handle processing_error event', () => {
    const error = new Error('Processing error');
    const message: Message = {
      MessageId: 'test-message-id-123',
    } as Message;

    consumer.onProcessingError(error, message);

    expect(mockCustomLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'SQS message processing error (weekly activities)',
        messageId: 'test-message-id-123',
        error: 'Processing error',
      }),
    );
  });

  it('should process large batches correctly', async () => {
    const message = createMockMessage();

    // Criar 250 usuários (mais de 1 lote)
    const summaries: WeeklyActivitiesSummary[] = Array.from(
      { length: 250 },
      (_, i) => ({
        userId: i + 1,
        totalActivities: 2,
        completedActivities: 1,
      }),
    );

    mockActivitiesRepository.getWeeklyActivitiesSummary.mockResolvedValue(
      summaries,
    );
    mockNotificationQueueService.addNotificationJob.mockResolvedValue(
      undefined,
    );

    await consumer.handleMessage(message);

    // Deve enviar 250 notificações
    expect(
      mockNotificationQueueService.addNotificationJob,
    ).toHaveBeenCalledTimes(250);

    // Deve logar sobre os lotes
    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Processing batch',
        batchNumber: 1,
        batchSize: 200,
        totalBatches: 2,
      }),
    );

    expect(mockCustomLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Processing batch',
        batchNumber: 2,
        batchSize: 50,
        totalBatches: 2,
      }),
    );
  });
});
