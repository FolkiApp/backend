import { Test, TestingModule } from '@nestjs/testing';
import { ImportantDateController } from '../important-date.controller';
import { FindAllImportantDateService } from '../services/find-all-important-date.service';
import { CreateImportantDateService } from '../services/create-important-date.service';
import { ImportantDateResponseDto } from '../dtos/important-date.dto';
import {
  ImportantDate,
  ImportantDateType,
} from '../entities/important-date.entity';
import type { AuthUser } from '../../common/guards/auth.guard';

describe('ImportantDateController', () => {
  let controller: ImportantDateController;
  let findAllImportantDateService: FindAllImportantDateService;
  let createImportantDateService: CreateImportantDateService;

  const mockFindAllImportantDateService = {
    execute: jest.fn(),
  };

  const mockCreateImportantDateService = {
    execute: jest.fn(),
  };

  const authUser: AuthUser = {
    id: 1,
    email: 'user@test.com',
    name: 'User Test',
    instituteId: 10,
    courseId: 5,
    isAdmin: true,
    isBlocked: false,
    universityId: 20,
    userVersion: '1.0.0',
  };

  const mockImportantDates: ImportantDate[] = [
    {
      id: 1,
      name: 'Início do semestre',
      date: new Date('2025-02-10'),
      type: ImportantDateType.GENERAL,
      shouldNotify: true,
      campusId: 5,
      universityId: 20,
    },
    {
      id: 2,
      name: 'Feriado Nacional',
      date: new Date('2025-04-21'),
      type: ImportantDateType.DAY_OFF,
      shouldNotify: false,
      campusId: null,
      universityId: 20,
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportantDateController],
      providers: [
        {
          provide: FindAllImportantDateService,
          useValue: mockFindAllImportantDateService,
        },
        {
          provide: CreateImportantDateService,
          useValue: mockCreateImportantDateService,
        },
      ],
    }).compile();

    controller = module.get<ImportantDateController>(ImportantDateController);
    findAllImportantDateService = module.get(FindAllImportantDateService);
    createImportantDateService = module.get(CreateImportantDateService);
  });

  describe('findAll', () => {
    it('retorna lista de ImportantDateResponseDto', async () => {
      mockFindAllImportantDateService.execute.mockResolvedValue(
        mockImportantDates,
      );

      const result = await controller.findAll(authUser);

      expect(findAllImportantDateService.execute).toHaveBeenCalledWith(
        authUser,
      );
      expect(result).toHaveLength(2);

      result.forEach((item, index) => {
        const expected = mockImportantDates[index];

        expect(item).toBeInstanceOf(ImportantDateResponseDto);
        expect(item).toMatchObject({
          id: expected.id,
          name: expected.name,
          date: expected.date,
          type: expected.type,
          shouldNotify: expected.shouldNotify,
          campusId: expected.campusId,
          universityId: expected.universityId,
        });
      });
    });

    it('retorna array vazio quando não houver datas', async () => {
      mockFindAllImportantDateService.execute.mockResolvedValue([]);

      const result = await controller.findAll(authUser);

      expect(result).toEqual([]);
      expect(findAllImportantDateService.execute).toHaveBeenCalledTimes(1);
    });

    it('propaga erro quando o service falhar', async () => {
      mockFindAllImportantDateService.execute.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.findAll(authUser)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('create', () => {
    it('cria uma nova data importante e retorna DTO', async () => {
      const payload: Omit<ImportantDate, 'id'> = {
        name: 'Semana de provas',
        date: new Date('2025-06-10'),
        type: ImportantDateType.GENERAL,
        shouldNotify: true,
        campusId: 5,
        universityId: 20,
      };

      const created: ImportantDate = {
        id: 99,
        ...payload,
      };

      mockCreateImportantDateService.execute.mockResolvedValue(created);

      const result = await controller.create(authUser, payload);

      expect(createImportantDateService.execute).toHaveBeenCalledWith(
        payload,
        authUser,
      );

      expect(result).toBeInstanceOf(ImportantDateResponseDto);
      expect(result).toMatchObject(created);
    });

    it('propaga erro quando o service falhar', async () => {
      const payload: Omit<ImportantDate, 'id'> = {
        name: 'Erro',
        date: new Date(),
        type: ImportantDateType.GENERAL,
        shouldNotify: false,
        campusId: null,
        universityId: 20,
      };

      mockCreateImportantDateService.execute.mockRejectedValue(
        new Error('Create error'),
      );

      await expect(controller.create(authUser, payload)).rejects.toThrow(
        'Create error',
      );
    });
  });
});
