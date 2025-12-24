import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSubjectRepository } from '../repositories/user-subject.repository';

describe('UserSubjectRepository', () => {
  let repository: UserSubjectRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user_subject: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSubjectRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserSubjectRepository>(UserSubjectRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findManyByUserId', () => {
    it('deve retornar todas as matérias de um usuário', async () => {
      const mockUserSubjects = [
        { id: 1, userId: 1, subjectClassId: 1 },
        { id: 2, userId: 1, subjectClassId: 2 },
      ];

      mockPrismaService.user_subject.findMany.mockResolvedValue(
        mockUserSubjects,
      );

      const result = await repository.findManyByUserId(1);

      expect(result).toEqual(mockUserSubjects);
      expect(prismaService.user_subject.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });

  describe('findByUserAndSubjectClass', () => {
    it('deve retornar uma relação usuário-matéria existente', async () => {
      const mockUserSubject = {
        id: 1,
        userId: 1,
        subjectClassId: 1,
      };

      mockPrismaService.user_subject.findFirst.mockResolvedValue(
        mockUserSubject,
      );

      const result = await repository.findByUserAndSubjectClass(1, 1);

      expect(result).toEqual(mockUserSubject);
      expect(prismaService.user_subject.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 1,
          subjectClassId: 1,
        },
      });
    });

    it('deve retornar null quando relação não existe', async () => {
      mockPrismaService.user_subject.findFirst.mockResolvedValue(null);

      const result = await repository.findByUserAndSubjectClass(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar uma nova relação usuário-matéria', async () => {
      const mockCreated = {
        id: 1,
        userId: 1,
        subjectClassId: 1,
      };

      mockPrismaService.user_subject.create.mockResolvedValue(mockCreated);

      const result = await repository.create(1, 1);

      expect(result).toEqual(mockCreated);
      expect(prismaService.user_subject.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          subjectClassId: 1,
        },
      });
    });
  });

  describe('softDeleteMany', () => {
    it('deve fazer soft delete de múltiplas relações', async () => {
      const mockResult = { count: 2 };

      mockPrismaService.user_subject.updateMany.mockResolvedValue(mockResult);

      const result = await repository.softDeleteMany(1, [1, 2]);

      expect(result).toEqual(mockResult);
      expect(prismaService.user_subject.updateMany).toHaveBeenCalled();
    });
  });
});
