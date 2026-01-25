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

    repository = module.get<SubjectClassRepository>(SubjectClassRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findLatest', () => {
    it('deve retornar o ano e semestre mais recentes', async () => {
      const latest = { year: 2024, semester: 2 };

      mockPrismaService.subject_class.findFirst.mockResolvedValue(latest);

      const result = await repository.findLatest();

      expect(result).toEqual(latest);
      expect(prismaService.subject_class.findFirst).toHaveBeenCalledWith({
        orderBy: [{ year: 'desc' }, { semester: 'desc' }],
        select: {
          year: true,
          semester: true,
        },
      });
    });

    it('deve retornar null quando não existir turma', async () => {
      mockPrismaService.subject_class.findFirst.mockResolvedValue(null);

      const result = await repository.findLatest();

      expect(result).toBeNull();
    });
  });

  describe('findBySubjectAndSchedule', () => {
    it('deve retornar uma turma pelo subject e horário', async () => {
      const availableDays = { mon: ['10:00'], tue: ['14:00'] };

      const mockSubjectClass = {
        id: 1,
        subjectId: 1,
        availableDays,
        year: 2024,
        semester: 1,
        universityId: 1,
        observations: 'Turma A',
      };

      mockPrismaService.subject_class.findFirst.mockResolvedValue(
        mockSubjectClass,
      );

      const result = await repository.findBySubjectAndSchedule(
        1,
        availableDays,
        2024,
        1,
        1,
      );

      expect(result).toEqual(mockSubjectClass);
      expect(prismaService.subject_class.findFirst).toHaveBeenCalledWith({
        where: {
          subjectId: 1,
          availableDays: {
            equals: availableDays,
          },
          year: 2024,
          semester: 1,
          universityId: 1,
        },
      });
    });

    it('deve retornar null quando turma não existir', async () => {
      mockPrismaService.subject_class.findFirst.mockResolvedValue(null);

      const result = await repository.findBySubjectAndSchedule(
        999,
        {},
        2024,
        1,
        1,
      );

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar uma nova turma', async () => {
      const availableDays = { wed: ['08:00'], fri: ['10:00'] };

      const mockCreatedClass = {
        id: 1,
        subjectId: 1,
        availableDays,
        year: 2024,
        semester: 2,
        universityId: 1,
        observations: 'Turma B',
      };

      mockPrismaService.subject_class.create.mockResolvedValue(
        mockCreatedClass,
      );

      const result = await repository.create(
        1,
        availableDays,
        2024,
        2,
        1,
        'Turma B',
      );

      expect(result).toEqual(mockCreatedClass);
      expect(prismaService.subject_class.create).toHaveBeenCalledWith({
        data: {
          subjectId: 1,
          availableDays,
          year: 2024,
          semester: 2,
          universityId: 1,
          observations: 'Turma B',
        },
      });
    });
  });

  describe('updateObservations', () => {
    it('deve atualizar as observações da turma', async () => {
      const mockUpdatedClass = {
        id: 1,
        observations: 'Observações atualizadas',
      };

      mockPrismaService.subject_class.update.mockResolvedValue(
        mockUpdatedClass,
      );

      const result = await repository.updateObservations(
        1,
        'Observações atualizadas',
      );

      expect(result).toEqual(mockUpdatedClass);
      expect(prismaService.subject_class.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { observations: 'Observações atualizadas' },
      });
    });
  });

  describe('findByIdAndUserId', () => {
    it('deve retornar SubjectClass quando usuário pertence à turma', async () => {
      const prismaClass = {
        id: 1,
        subjectId: 2,
        availableDays: { mon: ['10:00'] },
        year: 2024,
        semester: 1,
        universityId: 1,
        observations: 'Turma A',
      };

      mockPrismaService.subject_class.findFirst.mockResolvedValue(prismaClass);

      const result = await repository.findByIdAndUserId(1, 10);

      expect(result).toBeInstanceOf(SubjectClass);
      expect(result?.id).toBe(1);
      expect(result?.subjectId).toBe(2);

      expect(prismaService.subject_class.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_subject: {
            some: { userId: 10 },
          },
        },
      });
    });

    it('deve retornar null quando turma não pertencer ao usuário', async () => {
      mockPrismaService.subject_class.findFirst.mockResolvedValue(null);

      const result = await repository.findByIdAndUserId(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithSubject', () => {
    it('deve retornar turma com nome da disciplina', async () => {
      const prismaResult = {
        id: 1,
        subject: {
          name: 'Algoritmos',
        },
      };

      mockPrismaService.subject_class.findUnique.mockResolvedValue(
        prismaResult,
      );

      const result = await repository.findByIdWithSubject(1);

      expect(result).toEqual(prismaResult);
      expect(prismaService.subject_class.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          subject: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    it('deve retornar null quando turma não existir', async () => {
      mockPrismaService.subject_class.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithSubject(999);

      expect(result).toBeNull();
    });
  });
});
