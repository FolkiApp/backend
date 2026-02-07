import { Test, TestingModule } from '@nestjs/testing';

import { ImportantDateController } from '../important-date.controller';
import { FindAllImportantDateService } from '../services/find-all-important-date.service';
import { CreateImportantDateService } from '../services/create-important-date.service';
import { DeleteImportantDateService } from '../services/delete-important-date.service';

import { ImportantDateResponseDto } from '../dtos/important-date.dto';
import { ImportantDateType } from '../entities/important-date-type.entity';
import { CreateImportantDateDto } from '../dtos/create-important-date.dto';
import type { AuthUser } from '../../common/guards/auth.guard';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('ImportantDateController', () => {
  let controller: ImportantDateController;
  let findAllService: FindAllImportantDateService;
  let createService: CreateImportantDateService;
  let deleteService: DeleteImportantDateService;

  const mockFindAllService = {
    execute: jest.fn(),
  };

  const mockCreateService = {
    execute: jest.fn(),
  };

  const mockDeleteService = {
    execute: jest.fn(),
  };

  const mockCustomLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
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
        { provide: DeleteImportantDateService, useValue: mockDeleteService },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    controller = module.get(ImportantDateController);
    findAllService = module.get(FindAllImportantDateService);
    createService = module.get(CreateImportantDateService);
    deleteService = module.get(DeleteImportantDateService);

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
      expect(result.importantDates).toHaveLength(1);
      expect(result.importantDates[0]).toBeInstanceOf(ImportantDateResponseDto);
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

  describe('delete', () => {
    it('deleta uma data importante pelo id', async () => {
      const importantDateId = 10;

      mockDeleteService.execute.mockResolvedValue(undefined);

      await expect(controller.delete(importantDateId)).resolves.not.toThrow();

      expect(deleteService.execute).toHaveBeenCalledWith(importantDateId);
      expect(deleteService.execute).toHaveBeenCalledTimes(1);
    });
  });
});
