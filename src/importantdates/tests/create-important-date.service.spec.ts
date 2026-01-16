import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { CreateImportantDateService } from '../services/create-important-date.service';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { ImportantDateType } from '../entities/important-date.entity';
import { CreateImportantDateException } from '../exceptions/create-important-date.exception';
import { CreateImportantDateDto } from '../dtos/create-importante-date.dto';

describe('CreateImportantDateService', () => {
  let service: CreateImportantDateService;
  let repository: ImportantDateRepository;

  const mockImportantDateRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateImportantDateService,
        {
          provide: ImportantDateRepository,
          useValue: mockImportantDateRepository,
        },
      ],
    }).compile();

    service = module.get<CreateImportantDateService>(
      CreateImportantDateService,
    );
    repository = module.get<ImportantDateRepository>(ImportantDateRepository);

    // Evita poluir o output do teste com logs
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  describe('execute', () => {
    it('cria uma data importante com sucesso', async () => {
      const payload: CreateImportantDateDto = {
        name: 'Semana de Provas',
        date: new Date('2025-07-10'),
        type: ImportantDateType.GENERAL,
        shouldNotify: true,
        campusId: 2,
        universityId: 1,
      };

      const createdImportantDate = {
        id: 100,
        ...payload,
      };

      mockImportantDateRepository.create.mockResolvedValue(
        createdImportantDate,
      );

      const result = await service.execute(payload);

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith(payload);

      expect(result).toEqual(createdImportantDate);
    });

    it('loga erro e lança CreateImportantDateException quando o repository falhar', async () => {
      const payload: CreateImportantDateDto = {
        name: 'Evento com erro',
        date: new Date(),
        type: ImportantDateType.DAY_OFF,
        shouldNotify: false,
        campusId: null,
        universityId: 1,
      };

      const repositoryError = new Error('Database error');

      mockImportantDateRepository.create.mockRejectedValue(repositoryError);

      await expect(service.execute(payload)).rejects.toBeInstanceOf(
        CreateImportantDateException,
      );

      await expect(service.execute(payload)).rejects.toThrow(
        'Failed to create important date',
      );

      expect(repository.create).toHaveBeenCalledWith(payload);
    });
  });
});
