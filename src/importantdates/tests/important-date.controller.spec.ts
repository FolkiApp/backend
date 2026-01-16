import { Test, TestingModule } from '@nestjs/testing';
import { ImportantDateController } from '../important-date.controller';
import { FindAllImportantDateService } from '../services/find-all-important-date.service';
import { CreateImportantDateService } from '../services/create-important-date.service';
import { ImportantDateResponseDto } from '../dtos/important-date.dto';
import { ImportantDateType } from '../entities/important-date.entity';
import { CreateImportantDateDto } from '../dtos/create-importante-date.dto';
import type { AuthUser } from '../../common/guards/auth.guard';

describe('ImportantDateController', () => {
  let controller: ImportantDateController;
  let findAllService: FindAllImportantDateService;
  let createService: CreateImportantDateService;

  const mockFindAllService = {
    execute: jest.fn(),
  };

  const mockCreateService = {
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportantDateController],
      providers: [
        {
          provide: FindAllImportantDateService,
          useValue: mockFindAllService,
        },
        {
          provide: CreateImportantDateService,
          useValue: mockCreateService,
        },
      ],
    }).compile();

    controller = module.get<ImportantDateController>(ImportantDateController);
    findAllService = module.get(FindAllImportantDateService);
    createService = module.get(CreateImportantDateService);
  });

  describe('findAll', () => {
    it('retorna lista de ImportantDateResponseDto', async () => {
      const serviceResult = [
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

      mockFindAllService.execute.mockResolvedValue(serviceResult);

      const result = await controller.findAll(authUser);

      expect(findAllService.execute).toHaveBeenCalledWith(authUser);
      expect(result).toHaveLength(2);

      result.forEach((dto, index) => {
        const expected = serviceResult[index];

        expect(dto).toBeInstanceOf(ImportantDateResponseDto);
        expect(dto).toEqual(
          new ImportantDateResponseDto(
            expected.id,
            expected.name,
            expected.date,
            expected.type,
            expected.shouldNotify,
            expected.campusId,
            expected.universityId,
          ),
        );
      });
    });

    it('retorna array vazio quando não houver datas', async () => {
      mockFindAllService.execute.mockResolvedValue([]);

      const result = await controller.findAll(authUser);

      expect(result).toEqual([]);
      expect(findAllService.execute).toHaveBeenCalledTimes(1);
    });

    it('propaga erro quando o service falhar', async () => {
      mockFindAllService.execute.mockRejectedValue(new Error('Service error'));

      await expect(controller.findAll(authUser)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('create', () => {
    it('cria uma nova data importante e retorna DTO', async () => {
      const payload: CreateImportantDateDto = {
        name: 'Semana de Provas',
        date: new Date('2025-06-10'),
        type: ImportantDateType.GENERAL,
        shouldNotify: true,
        campusId: 5,
        universityId: 20,
      };

      const serviceResult = {
        id: 99,
        ...payload,
      };

      mockCreateService.execute.mockResolvedValue(serviceResult);

      const result = await controller.create(payload);

      expect(createService.execute).toHaveBeenCalledWith(payload);

      expect(result).toBeInstanceOf(ImportantDateResponseDto);
      expect(result).toEqual(
        new ImportantDateResponseDto(
          serviceResult.id,
          serviceResult.name,
          serviceResult.date,
          serviceResult.type,
          serviceResult.shouldNotify,
          serviceResult.campusId,
          serviceResult.universityId,
        ),
      );
    });

    it('propaga erro quando o service falhar', async () => {
      const payload: CreateImportantDateDto = {
        name: 'Erro',
        date: new Date(),
        type: ImportantDateType.DAY_OFF,
        shouldNotify: false,
        campusId: null,
        universityId: 20,
      };

      mockCreateService.execute.mockRejectedValue(new Error('Create error'));

      await expect(controller.create(payload)).rejects.toThrow('Create error');
    });
  });
});
