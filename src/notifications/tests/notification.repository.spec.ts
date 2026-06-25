import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationRepository } from '../repositories/notification.repository';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
    },
    user_notification: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create notification and user links successfully', async () => {
      mockPrismaService.notification.create.mockResolvedValue({ id: 1 });

      await repository.createNotification('Title', 'Message', [1, 2]);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: {
          title: 'Title',
          message: 'Message',
          users: {
            create: [{ userId: 1 }, { userId: 2 }],
          },
        },
      });
    });
  });
});
