import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { ImportantDateType } from '../entities/important-date-type.entity';

describe('ImportantDateRepository', () => {
  let repository: ImportantDateRepository;
  let prisma: PrismaService;

  const mockPrisma = {
    important_date: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportantDateRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get(ImportantDateRepository);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('cria uma data importante', async () => {
      const data = {
        name: 'Feriado',
        date: new Date('2025-04-21T00:00:00.000Z'),
        type: ImportantDateType.DAY_OFF,
        shouldNotify: false,
        campusId: null,
        universityId: 20,
      };

      mockPrisma.important_date.create.mockResolvedValue({
        id: 1,
        ...data,
      });

      const result = await repository.create(data);

      expect(prisma.important_date.create).toHaveBeenCalledWith({
        data: {
          ...data,
          type: data.type,
        },
      });

      expect(result.type).toBe(ImportantDateType.DAY_OFF);
    });
  });

  describe('findAll', () => {
    it('retorna datas filtradas quando campusId é null', async () => {
      const startOfYear = new Date('2025-01-01');

      mockPrisma.important_date.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Início do semestre',
          date: new Date('2025-02-10'),
          type: ImportantDateType.GENERAL,
          shouldNotify: true,
          campusId: null,
          universityId: 20,
        },
      ]);

      const result = await repository.findAll(startOfYear, 20, null);

      expect(prisma.important_date.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
        where: {
          date: { gte: startOfYear },
          universityId: 20,
          OR: [{ campusId: null }],
        },
      });

      expect(result[0].type).toBe(ImportantDateType.GENERAL);
    });

    it('retorna datas do campus específico e globais quando campusId é informado', async () => {
      const startOfYear = new Date('2025-01-01');

      mockPrisma.important_date.findMany.mockResolvedValue([
        {
          id: 2,
          name: 'Semana Acadêmica',
          date: new Date('2025-03-15'),
          type: ImportantDateType.GENERAL,
          shouldNotify: true,
          campusId: 5,
          universityId: 20,
        },
      ]);

      const result = await repository.findAll(startOfYear, 20, 5);

      expect(prisma.important_date.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'asc' },
        where: {
          date: { gte: startOfYear },
          universityId: 20,
          OR: [{ campusId: 5 }, { campusId: null }],
        },
      });

      expect(result[0].type).toBe(ImportantDateType.GENERAL);
    });
  });

  describe('delete', () => {
    it('remove uma data importante pelo id', async () => {
      mockPrisma.important_date.delete.mockResolvedValue(undefined);

      await expect(repository.delete(10)).resolves.not.toThrow();

      expect(prisma.important_date.delete).toHaveBeenCalledWith({
        where: { id: 10 },
      });
    });
  });
});
