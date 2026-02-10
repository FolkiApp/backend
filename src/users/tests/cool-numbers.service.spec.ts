import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repositories/user.repository';
import { CoolNumbersService } from '../services/cool-numbers.service';
import { UsersCountException } from '../exceptions/users-count.exception';
import { CoolNumbersEntity } from '../entities/cool-numbers.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('CoolNumbersService', () => {
  let service: CoolNumbersService;
  let userRepository: UserRepository;

  const mockUserRepository = {
    count: jest.fn(),
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
        CoolNumbersService,
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

    service = module.get(CoolNumbersService);
    userRepository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar os cool numbers com sucesso', async () => {
      mockUserRepository.count.mockResolvedValue(42);

      const result = await service.execute();

      expect(result).toEqual(new CoolNumbersEntity(42));
      expect(userRepository.count).toHaveBeenCalledTimes(1);
    });

    it('deve lançar UsersCountException quando falhar', async () => {
      mockUserRepository.count.mockRejectedValue(new Error());

      await expect(service.execute()).rejects.toBeInstanceOf(
        UsersCountException,
      );
    });
  });
});
