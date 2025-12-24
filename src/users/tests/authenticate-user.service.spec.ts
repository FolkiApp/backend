import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticateUserService } from '../services/authenticate-user.service';
import { ScrapJupiterService } from '../services/scrap-jupiter.service';
import { AccessUFSCarSigaaService } from '../services/access-ufscar-sigaa.service';
import { InvalidUniversityException } from '../../common/exceptions/invalid-university.exception';
import { InvalidCredentialsException } from '../../common/exceptions/invalid-credentials.exception';
import { UniversitySystemTimeoutException } from '../../common/exceptions/university-system-timeout.exception';
import { AuthDto } from '../dto/auth.dto';

describe('AuthenticateUserService', () => {
  let service: AuthenticateUserService;
  let scrapJupiterService: ScrapJupiterService;
  let accessUFSCarSigaaService: AccessUFSCarSigaaService;

  const mockScrapJupiterService = {
    execute: jest.fn(),
  };

  const mockAccessUFSCarSigaaService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    // Set JWT_SECRET for tests
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
      ],
    }).compile();

    service = module.get<AuthenticateUserService>(AuthenticateUserService);
    scrapJupiterService = module.get<ScrapJupiterService>(ScrapJupiterService);
    accessUFSCarSigaaService = module.get<AccessUFSCarSigaaService>(
      AccessUFSCarSigaaService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('execute', () => {
    const authDto: AuthDto = {
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

    it('deve autenticar usuário da USP com sucesso', async () => {
      mockScrapJupiterService.execute.mockResolvedValue(mockUser);

      const result = await service.execute(authDto);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(scrapJupiterService.execute).toHaveBeenCalledWith(
        authDto.uspCode,
        authDto.password,
      );
    });

    it('deve autenticar usuário da UFSCar com sucesso', async () => {
      const ufSCarAuthDto = { ...authDto, universityId: 2 };
      mockAccessUFSCarSigaaService.execute.mockResolvedValue(mockUser);

      const result = await service.execute(ufSCarAuthDto);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(accessUFSCarSigaaService.execute).toHaveBeenCalledWith(
        authDto.uspCode,
        authDto.password,
      );
    });

    it('deve lançar InvalidUniversityException para universidade inválida', async () => {
      const invalidAuthDto = { ...authDto, universityId: 999 };

      await expect(service.execute(invalidAuthDto)).rejects.toThrow(
        InvalidUniversityException,
      );
    });

    it('deve lançar InvalidCredentialsException para credenciais inválidas', async () => {
      mockScrapJupiterService.execute.mockRejectedValue(
        new Error(
          "Waiting for selector `a[href='gradeHoraria?codmnu=4759']` failed",
        ),
      );

      await expect(service.execute(authDto)).rejects.toThrow(
        InvalidCredentialsException,
      );
    });

    it('deve lançar UniversitySystemTimeoutException para timeout', async () => {
      mockScrapJupiterService.execute.mockRejectedValue(
        new Error('Waiting failed: 30000ms exceeded'),
      );

      await expect(service.execute(authDto)).rejects.toThrow(
        UniversitySystemTimeoutException,
      );
    });
  });
});
