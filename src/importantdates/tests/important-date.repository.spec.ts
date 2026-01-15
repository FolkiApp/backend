import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { ImportantDateType } from '../entities/important-date.entity';

describe('ImportantDateRepository', () => {
  let repository: ImportantDateRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    important_date: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportantDateRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<ImportantDateRepository>(ImportantDateRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findAll', () => {
    const startOfYear = new Date(2025, 0, 1);
    const universityId = 1;

    it('busca datas por universidade e campus (incluindo campus null)', async () => {
      const campusId = 2;

      const prismaResult = [
        {
          id: 1,
          name: 'Início do semestre',
          date: new Date('2025-02-10'),
          type: ImportantDateType.GENERAL,
          shouldNotify: true,
          campusId: 2,
          universityId: 1,
        },
        {
          id: 2,
          name: 'Evento Geral',
          date: new Date('2025-03-01'),
          type: ImportantDateType.DAY_OFF,
          shouldNotify: false,
          campusId: null,
          universityId: 1,
        },
      ];

      mockPrismaService.important_date.findMany.mockResolvedValue(prismaResult);

      const result = await repository.findAll(
        startOfYear,
        universityId,
        campusId,
      );

      expect(prismaService.important_date.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
        where: {
          date: { gte: startOfYear },
          universityId,
          OR: [{ campusId }, { campusId: null }],
        },
      });

      expect(result).toHaveLength(2);
      result.forEach((item, index) => {
        expect(item).toMatchObject(prismaResult[index]);
        expect(Object.values(ImportantDateType)).toContain(item.type);
      });
    });

    it('busca apenas datas globais quando campusId for null', async () => {
      const prismaResult = [
        {
          id: 3,
          name: 'Evento Institucional',
          date: new Date('2025-06-01'),
          type: ImportantDateType.DAY_OFF,
          shouldNotify: true,
          campusId: null,
          universityId: 1,
        },
      ];

      mockPrismaService.important_date.findMany.mockResolvedValue(prismaResult);

      const result = await repository.findAll(startOfYear, universityId, null);

      expect(prismaService.important_date.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
        where: {
          date: { gte: startOfYear },
          universityId,
          OR: [{ campusId: null }],
        },
      });

      expect(result).toEqual(prismaResult);
    });

    it('retorna array vazio quando não houver registros', async () => {
      mockPrismaService.important_date.findMany.mockResolvedValue([]);

      const result = await repository.findAll(startOfYear, universityId, null);

      expect(result).toEqual([]);
    });

    it('propaga erro do Prisma', async () => {
      mockPrismaService.important_date.findMany.mockRejectedValue(
        new Error('Prisma error'),
      );

      await expect(
        repository.findAll(startOfYear, universityId, null),
      ).rejects.toThrow('Prisma error');
    });
  });

  describe('create', () => {
    it('cria uma data importante e converte o tipo corretamente', async () => {
      const payload = {
        name: 'Semana de Provas',
        date: new Date('2025-07-10'),
        type: ImportantDateType.GENERAL,
        shouldNotify: true,
        campusId: 2,
        universityId: 1,
      };

      const prismaResult = {
        id: 99,
        ...payload,
      };

      mockPrismaService.important_date.create.mockResolvedValue(prismaResult);

      const result = await repository.create(payload);

      expect(prismaService.important_date.create).toHaveBeenCalledWith({
        data: {
          ...payload,
          type: payload.type,
        },
      });

      expect(result).toMatchObject(prismaResult);
      expect(result.type).toBe(ImportantDateType.GENERAL);
    });

    it('propaga erro quando o Prisma falhar', async () => {
      mockPrismaService.important_date.create.mockRejectedValue(
        new Error('Create failed'),
      );

      await expect(repository.create({} as any)).rejects.toThrow(
        'Create failed',
      );
    });
  });
});
