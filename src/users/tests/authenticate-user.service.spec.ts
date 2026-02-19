import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticateUserService } from '../services/authenticate-user.service';
import { ScrapJupiterService } from '../services/scrap-jupiter.service';
import { AccessUFSCarSigaaService } from '../services/access-ufscar-sigaa.service';
import { AccessUnicampEdacService } from '../services/access-unicamp-edac.service';
import { InvalidUniversityException } from '../../common/exceptions/invalid-university.exception';
import { InvalidCredentialsException } from '../../common/exceptions/invalid-credentials.exception';
import { UniversitySystemTimeoutException } from '../../common/exceptions/university-system-timeout.exception';
import { AuthenticationException } from '../../common/exceptions/authentication.exception';
import { AuthDto } from '../dto/auth.dto';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('AuthenticateUserService', () => {
  let service: AuthenticateUserService;

  const mockScrapJupiterService = {
    execute: jest.fn(),
  };

  const mockAccessUFSCarSigaaService = {
    execute: jest.fn(),
  };

  const mockAccessUnicampEdacService = {
    execute: jest.fn(),
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
    process.env.JWT_SECRET = 'test-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateUserService,
        {
          provide: ScrapJupiterService,
          useValue: mockScrapJupiterService,
        },
        {
          provide: AccessUFSCarSigaaService,
          useValue: mockAccessUFSCarSigaaService,
        },
        {
          provide: AccessUnicampEdacService,
          useValue: mockAccessUnicampEdacService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<AuthenticateUserService>(AuthenticateUserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('execute', () => {
    const baseAuthDto: AuthDto = {
      uspCode: '12345678',
      password: 'senha123',
      universityId: 1,
    };

    const mockUser = {
      id: 1,
      email: 'test@usp.br',
      name: 'Test User',
      instituteId: 1,
      courseId: 1,
      isAdmin: false,
      universityId: 1,
      userVersion: 1,
      securePin: 'secure-pin-123',
    };

    it('deve autenticar usuário da USP (ID 1)', async () => {
      mockScrapJupiterService.execute.mockResolvedValue(mockUser);

      const result = await service.execute(baseAuthDto);

      expect(result.token).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);

      expect(mockScrapJupiterService.execute).toHaveBeenCalledWith(
        baseAuthDto.uspCode,
        baseAuthDto.password,
      );
    });

    it('deve autenticar usuário da UFSCar (ID 2)', async () => {
      const dto = { ...baseAuthDto, universityId: 2 };

      mockAccessUFSCarSigaaService.execute.mockResolvedValue(mockUser);

      const result = await service.execute(dto);

      expect(result.token).toBeDefined();

      expect(mockAccessUFSCarSigaaService.execute).toHaveBeenCalledWith(
        dto.uspCode,
        dto.password,
      );
    });

    it('deve autenticar usuário da Unicamp (ID 3)', async () => {
      const dto = { ...baseAuthDto, universityId: 3 };

      mockAccessUnicampEdacService.execute.mockResolvedValue({
        ...mockUser,
        universityId: 3,
      });

      const result = await service.execute(dto);

      expect(result.token).toBeDefined();

      expect(mockAccessUnicampEdacService.execute).toHaveBeenCalledWith(
        dto.uspCode,
        dto.password,
      );
    });

    it('deve lançar InvalidUniversityException para universidade inválida', async () => {
      const invalidAuthDto = { ...baseAuthDto, universityId: 999 };

      await expect(service.execute(invalidAuthDto)).rejects.toThrow(
        InvalidUniversityException,
      );
    });

    it('deve lançar InvalidCredentialsException', async () => {
      mockScrapJupiterService.execute.mockRejectedValue(
        new Error(
          "Waiting for selector `a[href='gradeHoraria?codmnu=4759']` failed",
        ),
      );

      await expect(service.execute(baseAuthDto)).rejects.toThrow(
        InvalidCredentialsException,
      );
    });

    it('deve lançar UniversitySystemTimeoutException', async () => {
      mockScrapJupiterService.execute.mockRejectedValue(
        new Error('Waiting failed: 30000ms exceeded'),
      );

      await expect(service.execute(baseAuthDto)).rejects.toThrow(
        UniversitySystemTimeoutException,
      );
    });

    it('deve lançar AuthenticationException para erro inesperado', async () => {
      mockScrapJupiterService.execute.mockRejectedValue(
        new Error('Erro inesperado qualquer'),
      );

      await expect(service.execute(baseAuthDto)).rejects.toThrow(
        AuthenticationException,
      );
    });
  });
});
