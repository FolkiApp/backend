import { Test, TestingModule } from '@nestjs/testing';
import { UpdateMeService } from '../services/update-me.service';
import { UserRepository } from '../repositories/user.repository';
import { UserNotificationIdRepository } from '../repositories/user-notification-id.repository';
import { UserUpdateException } from '../exceptions/user-update.exception';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('UpdateMeService', () => {
  let service: UpdateMeService;
  let userRepository: UserRepository;
  let userNotificationIdRepository: UserNotificationIdRepository;

  const mockUserRepository = {
    update: jest.fn(),
  };

  const mockUserNotificationIdRepository = {
    upsert: jest.fn(),
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
        UpdateMeService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserNotificationIdRepository,
          useValue: mockUserNotificationIdRepository,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<UpdateMeService>(UpdateMeService);
    userRepository = module.get<UserRepository>(UserRepository);
    userNotificationIdRepository = module.get<UserNotificationIdRepository>(
      UserNotificationIdRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userId = 1;
    const updateUserDto: UpdateUserDto = {
      name: 'João Silva',
      instituteId: 5,
    };

    const mockUser = new User({
      id: userId,
      email: 'joao@usp.br',
      name: 'João Silva',
      instituteId: 5,
      courseId: 12,
      isAdmin: false,
      universityId: 1,
      userVersion: '1.0.0',
    });

    it('deve atualizar usuário sem notificationId', async () => {
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await service.execute(userId, updateUserDto);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
      expect(result.name).toBe('João Silva');
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(userNotificationIdRepository.upsert).not.toHaveBeenCalled();
    });

    it('deve atualizar usuário e fazer upsert do notificationId quando fornecido', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const dtoWithNotification: UpdateUserDto = {
        ...updateUserDto,
        notificationId: validUuid,
      };

      mockUserRepository.update.mockResolvedValue(mockUser);
      mockUserNotificationIdRepository.upsert.mockResolvedValue({
        userId,
        notificationId: validUuid,
        lastUpdated: new Date(),
      });

      const result = await service.execute(userId, dtoWithNotification);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
      expect(userNotificationIdRepository.upsert).toHaveBeenCalledWith(
        userId,
        validUuid,
      );
      expect(userRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: 'João Silva',
          instituteId: 5,
        }),
      );
    });

    it('deve atualizar usuário mesmo se o upsert do notificationId falhar', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const dtoWithNotification: UpdateUserDto = {
        ...updateUserDto,
        notificationId: validUuid,
      };

      mockUserNotificationIdRepository.upsert.mockRejectedValue(
        new Error('Database error'),
      );
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await service.execute(userId, dtoWithNotification);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
      expect(userNotificationIdRepository.upsert).toHaveBeenCalledWith(
        userId,
        validUuid,
      );
      expect(userRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: 'João Silva',
          instituteId: 5,
        }),
      );
    });

    it('deve ignorar notificationId inválido (não UUID)', async () => {
      const dtoWithInvalidNotification: UpdateUserDto = {
        ...updateUserDto,
        notificationId: 'invalid-not-a-uuid',
      };

      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await service.execute(userId, dtoWithInvalidNotification);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
      expect(userNotificationIdRepository.upsert).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          name: 'João Silva',
          instituteId: 5,
        }),
      );
    });

    it('deve lançar UserUpdateException quando falha ao atualizar usuário', async () => {
      mockUserRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.execute(userId, updateUserDto)).rejects.toThrow(
        UserUpdateException,
      );

      expect(userRepository.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('deve lançar UserUpdateException quando repository retorna erro', async () => {
      mockUserRepository.update.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(service.execute(userId, updateUserDto)).rejects.toThrow(
        UserUpdateException,
      );
    });
  });
});
