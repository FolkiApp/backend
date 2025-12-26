import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { ImportDateType } from '@prisma/client';

describe('ImportantDateRepository', () => {
  let repository: ImportantDateRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    important_date: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportantDateRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<ImportantDateRepository>(ImportantDateRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const startOfYear = new Date(2025, 0, 1);
    const universityId = 1;

    const mockImportantDates = [
      {
        id: 1,
        name: 'Início do semestre',
        date: new Date('2025-02-10'),
        type: ImportDateType.GENERAL,
        shouldNotify: true,
        campusId: 2,
        universityId: 1,
      },
      {
        id: 2,
        name: 'Feriado',
        date: new Date('2025-04-21'),
        type: ImportDateType.DAY_OFF,
        shouldNotify: false,
        campusId: 2,
        universityId: 1,
      },
    ];

    it('retorna datas importantes filtradas por universidade e campus', async () => {
      const campusId = 2;

      mockPrismaService.important_date.findMany.mockResolvedValue(
        mockImportantDates,
      );

      const result = await repository.findAll(
        startOfYear,
        universityId,
        campusId,
      );

      expect(result).toEqual(
        mockImportantDates.map((d) => ({ ...d, type: d.type })),
      );

      expect(prismaService.important_date.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
        where: {
          date: { gte: startOfYear },
          universityId,
          OR: [{ campusId }, { campusId: null }],
        },
      });
    });

    it('retorna datas importantes com campusId null', async () => {
      const campusId = null;
      const mockDates = [
        {
          id: 3,
          name: 'Evento Geral',
          date: new Date('2025-06-01'),
          type: ImportDateType.DAY_OFF,
          shouldNotify: true,
          campusId: null,
          universityId: 1,
        },
      ];

      mockPrismaService.important_date.findMany.mockResolvedValue(mockDates);

      const result = await repository.findAll(
        startOfYear,
        universityId,
        campusId,
      );

      expect(result).toEqual(mockDates.map((d) => ({ ...d, type: d.type })));

      expect(prismaService.important_date.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
        where: {
          date: { gte: startOfYear },
          universityId,
          OR: [{ campusId: null }],
        },
      });
    });

    it('retorna array vazio quando não houver datas importantes', async () => {
      mockPrismaService.important_date.findMany.mockResolvedValue([]);

      const result = await repository.findAll(startOfYear, universityId, null);

      expect(result).toEqual([]);
      expect(prismaService.important_date.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
