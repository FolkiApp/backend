import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repositories/user.repository';
import { AddBadgeService } from '../services/add-badge.service';
import { AddBadgeException } from '../exceptions/add-badge.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import type { AuthUser } from '../../common/guards/auth.guard';

describe('AddBadgeService', () => {
  let service: AddBadgeService;
  let userRepository: UserRepository;

  const mockUserRepository = {
    addBadge: jest.fn(),
  };

  const mockCustomLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  };

  const mockAuthUser: AuthUser = {
    id: 1,
    email: 'test@usp.br',
    name: 'Test User',
    instituteId: 1,
    courseId: 1,
    isAdmin: false,
    isBlocked: false,
    universityId: 1,
    userVersion: '1.0.0',
    institute: null,
    university: null,
    badge: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddBadgeService,
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

    service = module.get(AddBadgeService);
    userRepository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve adicionar badge ao usuário com sucesso', async () => {
      mockUserRepository.addBadge.mockResolvedValue(undefined);

      await service.execute(mockAuthUser, '🎓');

      expect(userRepository.addBadge).toHaveBeenCalledWith(1, '🎓');
      expect(mockCustomLogger.log).toHaveBeenCalledWith({
        message: 'Adding badge',
      });
      expect(mockCustomLogger.log).toHaveBeenCalledWith({
        message: 'Badge added successfully',
        badge: '🎓',
      });
    });

    it('deve remover badge quando valor for null', async () => {
      mockUserRepository.addBadge.mockResolvedValue(undefined);

      await service.execute(mockAuthUser, null);

      expect(userRepository.addBadge).toHaveBeenCalledWith(1, null);
      expect(mockCustomLogger.log).toHaveBeenCalledWith({
        message: 'Badge added successfully',
        badge: null,
      });
    });

    it('deve lançar AddBadgeException quando falhar', async () => {
      const error = new Error('Database error');
      mockUserRepository.addBadge.mockRejectedValue(error);

      await expect(service.execute(mockAuthUser, '🎓')).rejects.toBeInstanceOf(
        AddBadgeException,
      );

      expect(mockCustomLogger.error).toHaveBeenCalledWith({
        message: 'Error adding badge',
        error,
      });
    });

    it('deve logar mensagem de erro quando repositório falhar', async () => {
      const dbError = new Error('Connection refused');
      mockUserRepository.addBadge.mockRejectedValue(dbError);

      await expect(service.execute(mockAuthUser, '⭐')).rejects.toThrow();

      expect(mockCustomLogger.error).toHaveBeenCalledWith({
        message: 'Error adding badge',
        error: dbError,
      });
    });

    it('deve usar o id do usuário autenticado', async () => {
      const anotherUser: AuthUser = {
        ...mockAuthUser,
        id: 999,
      };
      mockUserRepository.addBadge.mockResolvedValue(undefined);

      await service.execute(anotherUser, '🏆');

      expect(userRepository.addBadge).toHaveBeenCalledWith(999, '🏆');
    });
  });
});
