import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';

import { user_subject } from '@prisma/client'; // Importe o tipo gerado pelo Prisma
import { UserSubjectRepository } from '../repositories/user-subject.repository';

describe('UserSubjectRepository', () => {
  let repository: UserSubjectRepository;
  let prismaService: PrismaService;

  const mockPrisma = {
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
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<UserSubjectRepository>(UserSubjectRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserAndClass', () => {
    it('deve retornar entidades mapeadas corretamente', async () => {
      const mockDbRows: user_subject[] = [
        {
          id: 1,
          userId: 1,
          subjectClassId: 10,
          absences: 0,
          grading: 10,
          createdAt: new Date(),
          deletedAt: null,
        },
      ];

      jest
        .spyOn(prismaService.user_subject, 'findMany')
        .mockResolvedValue(mockDbRows);

      const result = await repository.findByUserAndClass(1, 2023, 1);

      expect(result).toEqual(mockDbRows);
    });
  });

  describe('findManyByUserId', () => {
    it('deve retornar todos os registros de um usuário', async () => {
      const mockRows: user_subject[] = [
        {
          id: 1,
          userId: 1,
          subjectClassId: 10,
          absences: 0,
          grading: 10,
          createdAt: new Date(),
          deletedAt: null,
        },
      ];

      jest
        .spyOn(prismaService.user_subject, 'findMany')
        .mockResolvedValue(mockRows);

      const result = await repository.findManyByUserId(1);

      expect(result).toEqual(mockRows);
      expect(prismaService.user_subject.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });

  describe('findByUserAndSubjectClass', () => {
    it('deve retornar um registro específico ou null', async () => {
      const mockRow: user_subject = {
        id: 1,
        userId: 1,
        subjectClassId: 10,
        absences: 0,
        grading: 10,
        createdAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(prismaService.user_subject, 'findFirst')
        .mockResolvedValue(mockRow);

      const result = await repository.findByUserAndSubjectClass(1, 10);

      expect(result).toEqual(mockRow);
    });
  });

  describe('create', () => {
    it('deve criar um novo registro com sucesso', async () => {
      const mockCreated: user_subject = {
        id: 1,
        userId: 1,
        subjectClassId: 10,
        absences: 0,
        grading: 0,
        createdAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(prismaService.user_subject, 'create')
        .mockResolvedValue(mockCreated);

      const result = await repository.create(1, 10);

      expect(result).toEqual(mockCreated);
      expect(prismaService.user_subject.create).toHaveBeenCalledWith({
        data: { userId: 1, subjectClassId: 10 },
      });
    });
  });

  describe('softDeleteMany', () => {
    it('deve realizar o soft delete de múltiplos registros', async () => {
      const mockUpdateResult = { count: 5 };

      jest
        .spyOn(prismaService.user_subject, 'updateMany')
        .mockResolvedValue(mockUpdateResult);

      const result = await repository.softDeleteMany(1, [10, 20, 30]);

      expect(result.count).toBe(5);
    });
  });
});
