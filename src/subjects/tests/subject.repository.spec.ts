import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SubjectRepository } from '../repositories/subject.repository';

describe('SubjectRepository', () => {
  let repository: SubjectRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    subject: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<SubjectRepository>(SubjectRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findManyByCodes', () => {
    it('deve retornar múltiplas matérias pelos códigos', async () => {
      const mockSubjects = [
        { id: 1, code: 'MAC0110', name: 'Introdução à Computação' },
        { id: 2, code: 'MAC0122', name: 'Princípios de Desenvolvimento' },
      ];

      mockPrismaService.subject.findMany.mockResolvedValue(mockSubjects);

      const result = await repository.findManyByCodes(['MAC0110', 'MAC0122']);

      expect(result).toEqual(mockSubjects);
      expect(prismaService.subject.findMany).toHaveBeenCalledWith({
        where: {
          code: {
            in: ['MAC0110', 'MAC0122'],
          },
        },
      });
    });

    it('deve retornar array vazio quando nenhuma matéria é encontrada', async () => {
      mockPrismaService.subject.findMany.mockResolvedValue([]);

      const result = await repository.findManyByCodes(['INVALID']);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('deve criar uma nova matéria', async () => {
      const mockCreatedSubject = {
        id: 1,
        code: 'MAC0338',
        name: 'Análise de Algoritmos',
        universityId: 1,
      };

      mockPrismaService.subject.create.mockResolvedValue(mockCreatedSubject);

      const result = await repository.create(
        'MAC0338',
        'Análise de Algoritmos',
        1,
      );

      expect(result).toEqual(mockCreatedSubject);
      expect(prismaService.subject.create).toHaveBeenCalledWith({
        data: {
          code: 'MAC0338',
          name: 'Análise de Algoritmos',
          universityId: 1,
        },
      });
    });
  });
});
