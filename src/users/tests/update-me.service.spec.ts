import { Test, TestingModule } from '@nestjs/testing';
import { UpdateMeService } from '../services/update-me.service';
import { UserRepository } from '../repositories/user.repository';
import { UserNotificationIdRepository } from '../repositories/user-notification-id.repository';
import { UserUpdateException } from '../exceptions/user-update.exception';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

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
      const dtoWithNotification: UpdateUserDto = {
        ...updateUserDto,
        notificationId: 'abc123-token',
      };

      mockUserRepository.update.mockResolvedValue(mockUser);
      mockUserNotificationIdRepository.upsert.mockResolvedValue({
        userId,
        notificationId: 'abc123-token',
        lastUpdated: new Date(),
      });

      const result = await service.execute(userId, dtoWithNotification);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
      expect(userNotificationIdRepository.upsert).toHaveBeenCalledWith(
        userId,
        'abc123-token',
      );
      expect(userRepository.update).toHaveBeenCalledWith(
        userId,
        dtoWithNotification,
      );
    });

    it('deve atualizar usuário mesmo se o upsert do notificationId falhar', async () => {
      const dtoWithNotification: UpdateUserDto = {
        ...updateUserDto,
        notificationId: 'abc123-token',
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
        'abc123-token',
      );
      expect(userRepository.update).toHaveBeenCalledWith(
        userId,
        dtoWithNotification,
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
