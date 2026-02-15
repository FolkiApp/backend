import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserNotificationIdRepository } from '../repositories/user-notification-id.repository';
import { UserNotificationId } from '../entities/user-notification-id.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('UserNotificationIdRepository', () => {
  let repository: UserNotificationIdRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user_notification_id: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockCustomLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserNotificationIdRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    repository = module.get<UserNotificationIdRepository>(
      UserNotificationIdRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserIdAndNotificationId', () => {
    it('deve retornar um notification ID quando existir', async () => {
      const mockRecord = {
        userId: 1,
        notificationId: 'abc123',
        lastUpdated: new Date(),
      };

      mockPrismaService.user_notification_id.findUnique.mockResolvedValue(
        mockRecord,
      );

      const result = await repository.findByUserIdAndNotificationId(
        1,
        'abc123',
      );

      expect(result).toBeInstanceOf(UserNotificationId);
      expect(result?.userId).toBe(1);
      expect(result?.notificationId).toBe('abc123');
      expect(
        prismaService.user_notification_id.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId_notificationId: {
            userId: 1,
            notificationId: 'abc123',
          },
        },
      });
    });

    it('deve retornar null quando não existir', async () => {
      mockPrismaService.user_notification_id.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserIdAndNotificationId(
        1,
        'nonexistent',
      );

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('deve criar um novo notification ID', async () => {
      const mockRecord = {
        userId: 1,
        notificationId: 'new-token',
        lastUpdated: new Date(),
      };

      mockPrismaService.user_notification_id.upsert.mockResolvedValue(
        mockRecord,
      );

      const result = await repository.upsert(1, 'new-token');

      expect(result).toBeInstanceOf(UserNotificationId);
      expect(result.userId).toBe(1);
      expect(result.notificationId).toBe('new-token');
      expect(prismaService.user_notification_id.upsert).toHaveBeenCalledWith({
        where: {
          userId_notificationId: {
            userId: 1,
            notificationId: 'new-token',
          },
        },
        update: {
          lastUpdated: expect.any(Date) as Date,
        },
        create: {
          userId: 1,
          notificationId: 'new-token',
        },
      });
    });

    it('deve atualizar um notification ID existente', async () => {
      const now = new Date();
      const mockRecord = {
        userId: 1,
        notificationId: 'existing-token',
        lastUpdated: now,
      };

      mockPrismaService.user_notification_id.upsert.mockResolvedValue(
        mockRecord,
      );

      const result = await repository.upsert(1, 'existing-token');

      expect(result).toBeInstanceOf(UserNotificationId);
      expect(result.lastUpdated).toEqual(now);
    });
  });

  describe('findAllByUserId', () => {
    it('deve retornar todos os notification IDs de um usuário', async () => {
      const mockRecords = [
        {
          userId: 1,
          notificationId: 'token1',
          lastUpdated: new Date('2025-01-15'),
        },
        {
          userId: 1,
          notificationId: 'token2',
          lastUpdated: new Date('2025-01-14'),
        },
      ];

      mockPrismaService.user_notification_id.findMany.mockResolvedValue(
        mockRecords,
      );

      const result = await repository.findAllByUserId(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserNotificationId);
      expect(result[0].notificationId).toBe('token1');
      expect(result[1].notificationId).toBe('token2');
      expect(prismaService.user_notification_id.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { lastUpdated: 'desc' },
      });
    });

    it('deve retornar array vazio quando usuário não tem notification IDs', async () => {
      mockPrismaService.user_notification_id.findMany.mockResolvedValue([]);

      const result = await repository.findAllByUserId(999);

      expect(result).toEqual([]);
    });
  });
});
