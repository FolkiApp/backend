import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSubjectRepository } from '../repositories/user-subject.repository';
import { user_subject } from '@prisma/client';
import { CustomLogger } from '../../common/logger/custom-logger.service';

type UserSubjectWithRelations = user_subject & {
  subjectClass: {
    id: number;
    availableDays: unknown;
    subject: {
      id: number;
      name: string;
    };
    observations: string | null;
  };
  user_absences: unknown[];
};

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
        UserSubjectRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
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
      const mockDbRows: UserSubjectWithRelations[] = [
        {
          id: 1,
          userId: 1,
          subjectClassId: 10,
          absences: 0,
          grading: 10,
          createdAt: new Date(),
          deletedAt: null,

          subjectClass: {
            id: 10,
            availableDays: [],
            subject: { id: 1, name: 'Algoritmos' },
            observations: null,
          },

          user_absences: [],
        },
      ];

      jest
        .spyOn(prismaService.user_subject, 'findMany')
        .mockResolvedValue(mockDbRows);

      const result = await repository.findByUserAndClass(1, 2023, 1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].subjectClass.id).toBe(10);
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
    it('deve retornar um registro específico', async () => {
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
    it('deve criar um novo registro', async () => {
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
    it('deve realizar soft delete', async () => {
      const payload: { count: number } = { count: 5 };

      jest
        .spyOn(prismaService.user_subject, 'updateMany')
        .mockResolvedValue(payload);

      const result = await repository.softDeleteMany(1, [10, 20]);

      expect(result.count).toBe(5);
    });
  });
});
