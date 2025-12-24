import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../repositories/user.repository';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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
    it('deve retornar um usuário pelo id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@usp.br',
        name: 'Test User',
        instituteId: 1,
        courseId: 1,
        isAdmin: false,
        isBlocked: false,
        universityId: 1,
        userVersion: 1,
        createdAt: new Date(),
        lastLogin: new Date(),
        lastAccess: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById(1);

      expect(result).toBeDefined();
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

    it('deve retornar null quando usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('deve retornar um usuário pelo email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@usp.br',
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@usp.br');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@usp.br' },
      });
    });

    it('deve retornar null quando email não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@usp.br');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar um novo usuário', async () => {
      const mockCreatedUser = {
        id: 1,
        email: 'new@usp.br',
        name: 'New User',
        courseId: 1,
        instituteId: 1,
        universityId: 1,
      };

      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await repository.create('new@usp.br', 'New User', 1, 1, 1);

      expect(result).toEqual(mockCreatedUser);
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
    it('deve atualizar o nome do usuário', async () => {
      const mockUpdatedUser = {
        id: 1,
        name: 'New Name',
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.updateName(1, 'New Name');

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      });
    });
  });
});
