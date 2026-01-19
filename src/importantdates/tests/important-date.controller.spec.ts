import { Test, TestingModule } from '@nestjs/testing';
import { ImportantDateController } from '../important-date.controller';
import { FindAllImportantDateService } from '../services/find-all-important-date.service';
import { CreateImportantDateService } from '../services/create-important-date.service';
import { ImportantDateResponseDto } from '../dtos/important-date.dto';
import { ImportantDateType } from '../entities/important-date-type.entity';
import { CreateImportantDateDto } from '../dtos/create-important-date.dto';
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportantDateController],
      providers: [
        { provide: FindAllImportantDateService, useValue: mockFindAllService },
        { provide: CreateImportantDateService, useValue: mockCreateService },
      ],
    }).compile();

    controller = module.get(ImportantDateController);
    findAllService = module.get(FindAllImportantDateService);
    createService = module.get(CreateImportantDateService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retorna lista de ImportantDateResponseDto', async () => {
      const serviceResult = [
        {
          id: 1,
          name: 'Início do semestre',
          date: new Date('2025-02-10T00:00:00.000Z'),
          type: ImportantDateType.GENERAL,
          shouldNotify: true,
          campusId: 5,
          universityId: 20,
        },
      ];

      mockFindAllService.execute.mockResolvedValue(serviceResult);

      const result = await controller.findAll(authUser);

      expect(findAllService.execute).toHaveBeenCalledWith(authUser);
      expect(result[0]).toBeInstanceOf(ImportantDateResponseDto);
    });
  });

  describe('create', () => {
    it('cria uma data importante', async () => {
      const payload: CreateImportantDateDto = {
        name: 'Semana de Provas',
        date: '2025-06-10T00:00:00.000Z',
        type: ImportantDateType.GENERAL,
        shouldNotify: true,
        campusId: 5,
        universityId: 20,
      };

      const serviceResult = {
        id: 99,
        ...payload,
        date: new Date(payload.date),
      };

      mockCreateService.execute.mockResolvedValue(serviceResult);

      const result = await controller.create(payload);

      expect(createService.execute).toHaveBeenCalledWith(payload);
      expect(result).toBeInstanceOf(ImportantDateResponseDto);
    });
  });
});
