import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { CreateImportantDateService } from '../services/create-important-date.service';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { CreateImportantDateException } from '../exceptions/create-important-date.exception';
import { CreateImportantDateDto } from '../dtos/create-important-date.dto';
import { ImportantDateType } from '../entities/important-date-type.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('CreateImportantDateService', () => {
  let service: CreateImportantDateService;
  let repository: ImportantDateRepository;

  const mockImportantDateRepository = {
    create: jest.fn(),
  };

  const mockCustomLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateImportantDateService,
        {
          provide: ImportantDateRepository,
          useValue: mockImportantDateRepository,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get(CreateImportantDateService);
    repository = module.get(ImportantDateRepository);

    jest.clearAllMocks();

    // Evita poluição de logs
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  describe('execute', () => {
    it('converte string para Date e cria a data importante', async () => {
      const payload: CreateImportantDateDto = {
        name: 'Semana de Provas',
        date: '2025-07-10T00:00:00.000Z',
        type: ImportantDateType.GENERAL,
        shouldNotify: true,
        campusId: 2,
        universityId: 1,
      };

      const createdImportantDate = {
        id: 100,
        ...payload,
        date: new Date(payload.date),
      };

      mockImportantDateRepository.create.mockResolvedValue(
        createdImportantDate,
      );

      const result = await service.execute(payload);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({
        ...payload,
        date: new Date(payload.date),
      });

      expect(result).toEqual(createdImportantDate);
    });

    it('loga erro e lança CreateImportantDateException quando o repository falhar', async () => {
      const payload: CreateImportantDateDto = {
        name: 'Evento com erro',
        date: '2025-01-01T00:00:00.000Z',
        type: ImportantDateType.DAY_OFF,
        shouldNotify: false,
        campusId: null,
        universityId: 1,
      };

      mockImportantDateRepository.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(payload)).rejects.toBeInstanceOf(
        CreateImportantDateException,
      );

      await expect(service.execute(payload)).rejects.toThrow(
        'Failed to create important date',
      );

      expect(repository.create).toHaveBeenCalledWith({
        ...payload,
        date: new Date(payload.date),
      });
    });
  });
});
