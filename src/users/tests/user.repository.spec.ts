import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
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
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('deve retornar um User quando encontrado', async () => {
      const prismaUser = {
        id: 1,
        email: 'test@usp.br',
        name: 'Test User',
        instituteId: 1,
        courseId: 1,
        isAdmin: false,
        isBlocked: false,
        universityId: 1,
        userVersion: '1.0.0',
        createdAt: new Date(),
        lastLogin: new Date(),
        lastAccess: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findById(1);

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe(1);
      expect(result?.email).toBe('test@usp.br');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          email: true,
          name: true,
          instituteId: true,
          courseId: true,
          isAdmin: true,
          isBlocked: true,
          universityId: true,
          userVersion: true,
          createdAt: true,
          lastLogin: true,
          lastAccess: true,
        },
      });
    });

    it('deve retornar null quando usuário não existir', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('deve retornar usuário pelo email', async () => {
      const prismaUser = {
        id: 1,
        email: 'test@usp.br',
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(prismaUser);

      const result = await repository.findByEmail('test@usp.br');

      expect(result).toEqual(prismaUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@usp.br' },
      });
    });

    it('deve retornar null quando email não existir', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('x@usp.br');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar um novo usuário', async () => {
      const createdUser = {
        id: 1,
        email: 'new@usp.br',
        name: 'New User',
        courseId: 1,
        instituteId: 1,
        universityId: 1,
      };

      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await repository.create('new@usp.br', 'New User', 1, 1, 1);

      expect(result).toEqual(createdUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@usp.br',
          name: 'New User',
          courseId: 1,
          instituteId: 1,
          universityId: 1,
        },
      });
    });
  });

  describe('updateName', () => {
    it('deve atualizar apenas o nome do usuário', async () => {
      const updatedUser = {
        id: 1,
        name: 'Updated Name',
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.updateName(1, 'Updated Name');

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('update', () => {
    it('deve atualizar dados do usuário e retornar entity User', async () => {
      const prismaUser = {
        id: 1,
        email: 'test@usp.br',
        name: 'Updated User',
        instituteId: 1,
        courseId: 1,
        isAdmin: false,
        isBlocked: false,
        universityId: 1,
        userVersion: '2.0.0',
        createdAt: new Date(),
        lastLogin: new Date(),
        lastAccess: new Date(),
      };

      mockPrismaService.user.update.mockResolvedValue(prismaUser);

      const result = await repository.update(1, {
        name: 'Updated User',
        userVersion: '2.0.0',
      });

      expect(result).toBeInstanceOf(User);
      expect(result.name).toBe('Updated User');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated User',
          userVersion: '2.0.0',
        },
        select: {
          id: true,
          email: true,
          name: true,
          instituteId: true,
          courseId: true,
          isAdmin: true,
          isBlocked: true,
          universityId: true,
          userVersion: true,
          createdAt: true,
          lastLogin: true,
          lastAccess: true,
        },
      });
    });
  });

  describe('count', () => {
    it('deve retornar a quantidade de usuários', async () => {
      mockPrismaService.user.count.mockResolvedValue(5);

      const result = await repository.count();

      expect(result).toBe(5);
      expect(prismaService.user.count).toHaveBeenCalledTimes(1);
    });
  });
});
