import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { FindUserByIdService } from '../services/find-user-by-id.service';
import { AuthenticateUserService } from '../services/authenticate-user.service';
import { UpdateMeService } from '../services/update-me.service';
import { User } from '../entities/user.entity';
import { AuthDto } from '../dto/auth.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import type { AuthUser } from '../../common/guards/auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let findUserByIdService: FindUserByIdService;
  let authenticateUserService: AuthenticateUserService;
  let updateMeService: UpdateMeService;

  const mockFindUserByIdService = {
    execute: jest.fn(),
  };

  const mockAuthenticateUserService = {
    execute: jest.fn(),
  };

  const mockUpdateMeService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: FindUserByIdService,
          useValue: mockFindUserByIdService,
        },
        {
          provide: AuthenticateUserService,
          useValue: mockAuthenticateUserService,
        },
        {
          provide: UpdateMeService,
          useValue: mockUpdateMeService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    findUserByIdService = module.get<FindUserByIdService>(FindUserByIdService);
    authenticateUserService = module.get<AuthenticateUserService>(
      AuthenticateUserService,
    );
    updateMeService = module.get<UpdateMeService>(UpdateMeService);
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

      const mockUser = new User(authUser);
      mockFindUserByIdService.execute.mockReturnValue(mockUser);

      const result = controller.me(authUser);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toBe(authUser.id);
      expect(result.email).toBe(authUser.email);
      expect(result.name).toBe(authUser.name);
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

      const mockResponse = new UserResponseDto(
        1,
        'test@usp.br',
        'Updated Name',
        1,
        1,
        false,
        1,
        '2.0.0',
      );

      mockUpdateMeService.execute.mockResolvedValue(mockResponse);

      const result = await controller.updateMe(authUser, updateUserDto);

      expect(result).toEqual(mockResponse);
      expect(updateMeService.execute).toHaveBeenCalledWith(1, updateUserDto);
    });
  });
});
