import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';

import { FindUserByIdService } from '../services/find-user-by-id.service';
import { AuthenticateUserService } from '../services/authenticate-user.service';
import { UpdateMeService } from '../services/update-me.service';
import { FindUserSubjectsService } from '../services/find-user-subjects.service';
import { CoolNumbersService } from '../services/cool-numbers.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

import { AuthDto } from '../dto/auth.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { MeResponseDto } from '../dto/me-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CoolNumbersDto } from '../dto/cool-numbers.dto';

import type { AuthUser } from '../../common/guards/auth.guard';

describe('UsersController', () => {
  let controller: UsersController;

  let findUserByIdService: FindUserByIdService;
  let authenticateUserService: AuthenticateUserService;
  let updateMeService: UpdateMeService;
  let coolNumbersService: CoolNumbersService;
  let findUserSubjectsService: FindUserSubjectsService;

  const mockFindUserByIdService = { execute: jest.fn() };
  const mockAuthenticateUserService = { execute: jest.fn() };
  const mockUpdateMeService = { execute: jest.fn() };
  const mockCoolNumbersService = { execute: jest.fn() };
  const mockFindUserSubjectsService = { execute: jest.fn() };

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
      controllers: [UsersController],
      providers: [
        { provide: FindUserByIdService, useValue: mockFindUserByIdService },
        {
          provide: AuthenticateUserService,
          useValue: mockAuthenticateUserService,
        },
        { provide: UpdateMeService, useValue: mockUpdateMeService },
        { provide: CoolNumbersService, useValue: mockCoolNumbersService },
        {
          provide: FindUserSubjectsService,
          useValue: mockFindUserSubjectsService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    findUserByIdService = module.get(FindUserByIdService);
    authenticateUserService = module.get(AuthenticateUserService);
    updateMeService = module.get(UpdateMeService);
    coolNumbersService = module.get(CoolNumbersService);
    findUserSubjectsService = module.get(FindUserSubjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('deve autenticar um usuário com sucesso', async () => {
      const authDto: AuthDto = {
        uspCode: '12345678',
        password: 'senha123',
        universityId: 1,
      };

      const mockResponse: AuthResponseDto = {
        token: 'mock-jwt-token',
        user: new UserResponseDto(
          1,
          'test@usp.br',
          'Test User',
          1,
          1,
          false,
          1,
          '1.0.0',
        ),
      };

      mockAuthenticateUserService.execute.mockResolvedValue(mockResponse);

      const result = await controller.authenticate(authDto);

      expect(result).toEqual(mockResponse);
      expect(authenticateUserService.execute).toHaveBeenCalledWith(authDto);
    });
  });

  describe('me', () => {
    it('deve retornar dados do usuário autenticado', () => {
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

      mockFindUserByIdService.execute.mockReturnValue(authUser);

      const result = controller.me(authUser);

      expect(result).toEqual(
        new MeResponseDto(
          new UserResponseDto(
            1,
            'test@usp.br',
            'Test User',
            1,
            1,
            false,
            1,
            '1.0.0',
          ),
        ),
      );

      expect(findUserByIdService.execute).toHaveBeenCalledWith(authUser);
    });
  });

  describe('updateMe', () => {
    it('deve atualizar dados do usuário com sucesso', async () => {
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

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        userVersion: '2.0.0',
      };

      const mockUser = {
        ...authUser,
        name: 'Updated Name',
        userVersion: '2.0.0',
      };

      mockUpdateMeService.execute.mockResolvedValue(mockUser);

      const result = await controller.updateMe(authUser, updateUserDto);

      expect(result).toEqual(
        new UserResponseDto(
          1,
          'test@usp.br',
          'Updated Name',
          1,
          1,
          false,
          1,
          '2.0.0',
        ),
      );

      expect(updateMeService.execute).toHaveBeenCalledWith(1, updateUserDto);
    });
  });

  describe('cool-numbers', () => {
    it('deve retornar quantidade de usuários', async () => {
      const mockResponse: CoolNumbersDto = { numbers: 10 };

      mockCoolNumbersService.execute.mockResolvedValue(mockResponse);

      const result = await controller.count();

      expect(result).toEqual(mockResponse);
      expect(coolNumbersService.execute).toHaveBeenCalled();
    });
  });

  describe('findMySubjects', () => {
    it('deve retornar disciplinas do usuário', async () => {
      const authUser: AuthUser = {
        id: 1,
        email: '',
        name: '',
        instituteId: 1,
        courseId: 1,
        isAdmin: false,
        isBlocked: false,
        universityId: 1,
        userVersion: '1.0.0',
      };

      const mockSubjects = [
        {
          id: 1,
          userId: 1,
          subjectClassId: 10,
          absences: 2,
          grading: 8,
          createdAt: new Date(),
          deletedAt: null,
          userAbsences: [],
        },
      ];

      mockFindUserSubjectsService.execute.mockResolvedValue(mockSubjects);

      const result = await controller.findMySubjects(authUser);

      expect(result.userSubjects).toHaveLength(1);
      expect(findUserSubjectsService.execute).toHaveBeenCalledWith(1, 1);
    });
  });
});
