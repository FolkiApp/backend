import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repositories/user.repository';
import { CountUsersService } from '../services/count-users.service';
import { UsersCountException } from '../exceptions/users-count.exception';

describe('CountUsersService', () => {
  let service: CountUsersService;
  let userRepository: UserRepository;

  const mockUserRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountUsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<CountUsersService>(CountUsersService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar a quantidade de usuários com sucesso', async () => {
      mockUserRepository.count.mockResolvedValue(42);

      const result = await service.execute();

      expect(result).toBe(42);
      expect(userRepository.count).toHaveBeenCalledTimes(1);
    });

    it('deve lançar UsersCountException quando o repository falhar', async () => {
      const error = new Error('Database error');
      mockUserRepository.count.mockRejectedValue(error);

      await expect(service.execute()).rejects.toBeInstanceOf(
        UsersCountException,
      );

      expect(userRepository.count).toHaveBeenCalledTimes(1);
    });
  });
});
