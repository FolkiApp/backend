import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { DeleteImportantDateService } from '../services/delete-important-date.service';
import { ImportantDateRepository } from '../repositories/important-date.repository';

describe('DeleteImportantDateService', () => {
  let service: DeleteImportantDateService;
  let repository: ImportantDateRepository;

  const mockImportantDateRepository = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteImportantDateService,
        {
          provide: ImportantDateRepository,
          useValue: mockImportantDateRepository,
        },
      ],
    }).compile();

    service = module.get(DeleteImportantDateService);
    repository = module.get(ImportantDateRepository);

    jest.clearAllMocks();

    // Evita poluição de logs
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  describe('execute', () => {
    it('deleta a data importante com sucesso', async () => {
      const importantDateId = 10;

      mockImportantDateRepository.delete.mockResolvedValue(undefined);

      await expect(service.execute(importantDateId)).resolves.not.toThrow();

      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(repository.delete).toHaveBeenCalledWith(importantDateId);
    });

    it('loga erro e lança Error quando o repository falhar', async () => {
      const importantDateId = 20;

      mockImportantDateRepository.delete.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(importantDateId)).rejects.toThrow(
        'Failed to delete important date',
      );

      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(repository.delete).toHaveBeenCalledWith(importantDateId);
    });
  });
});
