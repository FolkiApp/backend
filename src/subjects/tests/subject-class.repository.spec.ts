import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SubjectClassRepository } from '../repositories/subject-class.repository';
import { SubjectClass } from '../entities/subject-class.entity';

describe('SubjectClassRepository', () => {
  let repository: SubjectClassRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    subject_class: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectClassRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get(SubjectClassRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findLatest', () => {
    it('deve retornar o ano e semestre mais recentes', async () => {
      const latest = { year: 2024, semester: 2 };

      mockPrismaService.subject_class.findFirst.mockResolvedValue(latest);

      const result = await repository.findLatest(1);

      expect(result).toEqual(latest);
      expect(prismaService.subject_class.findFirst).toHaveBeenCalledWith({
        where: { universityId: 1 },
        orderBy: [{ year: 'desc' }, { semester: 'desc' }],
        select: { year: true, semester: true },
      });
    });

    it('deve retornar null quando não existir turma', async () => {
      mockPrismaService.subject_class.findFirst.mockResolvedValue(null);

      const result = await repository.findLatest(1);

      expect(result).toBeNull();
    });
  });

  describe('findBySubjectAndSchedule', () => {
    it('deve retornar SubjectClass', async () => {
      const prismaResult = {
        id: 1,
        subjectId: 1,
        availableDays: [],
        year: 2024,
        semester: 1,
        universityId: 1,
        observations: 'Turma A',
        subject: { id: 1, name: 'Algoritmos' },
      };

      mockPrismaService.subject_class.findFirst.mockResolvedValue(prismaResult);

      const result = await repository.findBySubjectAndSchedule(
        1,
        [],
        2024,
        1,
        1,
      );

      expect(result).toBeInstanceOf(SubjectClass);
      expect(result?.id).toBe(1);
    });
  });

  describe('create', () => {
    it('deve criar SubjectClass', async () => {
      const prismaResult = {
        id: 1,
        subjectId: 1,
        availableDays: [],
        year: 2024,
        semester: 2,
        universityId: 1,
        observations: 'Turma B',
        subject: { id: 1, name: 'Algoritmos' },
      };

      mockPrismaService.subject_class.create.mockResolvedValue(prismaResult);

      const result = await repository.create(1, [], 2024, 2, 1, 'Turma B');

      expect(result).toBeInstanceOf(SubjectClass);
      expect(result.id).toBe(1);
    });
  });

  describe('updateObservations', () => {
    it('deve atualizar observações', async () => {
      const prismaResult = {
        id: 1,
        subjectId: 1,
        availableDays: [],
        year: 2024,
        semester: 1,
        universityId: 1,
        observations: 'Atualizado',
        subject: { id: 1, name: 'Algoritmos' },
      };

      mockPrismaService.subject_class.update.mockResolvedValue(prismaResult);

      const result = await repository.updateObservations(1, 'Atualizado');

      expect(result).toBeInstanceOf(SubjectClass);
      expect(result.observations).toBe('Atualizado');
    });
  });

  describe('findByIdAndUserId', () => {
    it('deve retornar SubjectClass quando usuário pertence', async () => {
      const prismaClass = {
        id: 1,
        subjectId: 2,
        availableDays: [],
        year: 2024,
        semester: 1,
        universityId: 1,
        observations: 'Teste',
        subject: { id: 2, name: 'POO' },
      };

      mockPrismaService.subject_class.findFirst.mockResolvedValue(prismaClass);

      const result = await repository.findByIdAndUserId(1, 10);

      expect(result).toBeInstanceOf(SubjectClass);
      expect(result?.id).toBe(1);
    });

    it('deve retornar null se não encontrar', async () => {
      mockPrismaService.subject_class.findFirst.mockResolvedValue(null);

      const result = await repository.findByIdAndUserId(1, 10);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithSubject', () => {
    it('deve retornar turma com disciplina', async () => {
      const prismaResult = {
        id: 1,
        subject: { name: 'Algoritmos' },
      };

      mockPrismaService.subject_class.findUnique.mockResolvedValue(
        prismaResult,
      );

      const result = await repository.findByIdWithSubject(1);

      expect(result).toEqual(prismaResult);
    });
  });
});
