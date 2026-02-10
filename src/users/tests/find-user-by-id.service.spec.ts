import { Test, TestingModule } from '@nestjs/testing';
import { FindUserByIdService } from '../services/find-user-by-id.service';
import { User } from '../entities/user.entity';
import type { AuthUser } from '../../common/guards/auth.guard';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('FindUserByIdService', () => {
  let service: FindUserByIdService;

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
        FindUserByIdService,
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<FindUserByIdService>(FindUserByIdService);
  });

  describe('execute', () => {
    it('deve retornar um User a partir de um AuthUser', () => {
      const authUser: AuthUser = {
        id: 1,
        email: 'test@usp.br',
        name: 'Test User',
        instituteId: 1,
        courseId: 1,
        isAdmin: false,
        isBlocked: false,
        universityId: 1,
        userVersion: '1.0.0',
      };

      const result = service.execute(authUser);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(authUser.id);
      expect(result.email).toBe(authUser.email);
      expect(result.name).toBe(authUser.name);
    });
  });
});
