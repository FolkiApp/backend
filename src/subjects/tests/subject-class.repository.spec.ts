import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SubjectClassRepository } from '../repositories/subject-class.repository';

describe('SubjectClassRepository', () => {
  let repository: SubjectClassRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    subject_class: {
      findFirst: jest.fn(),
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

    it('deve retornar null quando turma não existe', async () => {
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
    it('deve atualizar as observações de uma turma', async () => {
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
});
