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
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ImportantDateRepository>(ImportantDateRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar datas importantes a partir do início do ano, filtradas por universidade e campus', async () => {
      const startOfYear = new Date(2025, 0, 1);
      const universityId = 1;
      const campusId = 2;

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

      mockPrismaService.important_date.findMany.mockResolvedValue(
        mockImportantDates,
      );

      const result = await repository.findAll(
        startOfYear,
        universityId,
        campusId,
      );

      expect(result).toEqual(mockImportantDates);
      expect(prismaService.important_date.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
        where: {
          date: { gte: startOfYear },
          universityId,
          campusId,
        },
      });
      expect(prismaService.important_date.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve retornar datas importantes com campusId null', async () => {
      const startOfYear = new Date(2025, 0, 1);
      const universityId = 1;
      const campusId = null;

      const mockImportantDates = [
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

      mockPrismaService.important_date.findMany.mockResolvedValue(
        mockImportantDates,
      );

      const result = await repository.findAll(
        startOfYear,
        universityId,
        campusId,
      );

      expect(result).toEqual(mockImportantDates);
      expect(prismaService.important_date.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
        where: {
          date: { gte: startOfYear },
          universityId,
          campusId: null,
        },
      });
      expect(prismaService.important_date.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando não houver datas importantes', async () => {
      mockPrismaService.important_date.findMany.mockResolvedValue([]);

      const result = await repository.findAll(new Date(2025, 0, 1), 1, null);

      expect(result).toEqual([]);
      expect(prismaService.important_date.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
