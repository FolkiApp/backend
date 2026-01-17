import { Test, TestingModule } from '@nestjs/testing';
import { DeleteAbsence } from '../services/delete-absence.service';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserAbsence } from '../entities/absence.entity';
import { NotFoundAbsences } from '../exceptions/absence-not-found.exception';
import { AbsenceInternalErrorException } from '../exceptions/absence-internal-error.exception';
import { AbsenceUnauthorized } from '../exceptions/absence-unauthorized.exception';

describe('DeleteAbsence', () => {
  let service: DeleteAbsence;

  const mockRepository = {
    findAbsenceById: jest.fn(),
    deleteAbsence: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAbsence,
        {
          provide: AbsenceRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DeleteAbsence>(DeleteAbsence);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve deletar uma falta existente com sucesso', async () => {
      const mockAbsence = new UserAbsence(
        5,
        new Date('2025-03-12'),
        new Date('2025-03-12T11:00:00'),
        3,
        7,
      );

      mockRepository.findAbsenceById.mockResolvedValue(mockAbsence);
      mockRepository.deleteAbsence.mockResolvedValue(undefined);

      const authUser = { id: 3, email: 'user@example.com', name: 'Test User' };

      await service.execute(authUser, 5);

      expect(mockRepository.findAbsenceById).toHaveBeenCalledWith(3, 5);
      expect(mockRepository.deleteAbsence).toHaveBeenCalledWith(3, 5);
    });

    it('deve lançar NotFoundAbsences quando a falta não existe', async () => {
      mockRepository.findAbsenceById.mockResolvedValue(null);

      const authUser = { id: 3, email: 'user@example.com', name: 'Test User' };

      await expect(service.execute(authUser, 999)).rejects.toThrow(
        NotFoundAbsences,
      );
      expect(mockRepository.findAbsenceById).toHaveBeenCalledWith(3, 999);
      expect(mockRepository.deleteAbsence).not.toHaveBeenCalled();
    });

    it('deve lançar AbsenceInternalErrorException quando findAbsenceById falha', async () => {
      mockRepository.findAbsenceById.mockRejectedValue(
        new Error('DB connection error'),
      );

      const authUser = { id: 3, email: 'user@example.com', name: 'Test User' };

      await expect(service.execute(authUser, 5)).rejects.toThrow(
        AbsenceInternalErrorException,
      );
      expect(mockRepository.deleteAbsence).not.toHaveBeenCalled();
    });

    it('deve lançar AbsenceInternalErrorException quando deleteAbsence falha', async () => {
      const mockAbsence = new UserAbsence(
        5,
        new Date('2025-03-12'),
        new Date('2025-03-12T11:00:00'),
        3,
        7,
      );

      mockRepository.findAbsenceById.mockResolvedValue(mockAbsence);
      mockRepository.deleteAbsence.mockRejectedValue(
        new Error('DB delete error'),
      );

      const authUser = { id: 3, email: 'user@example.com', name: 'Test User' };

      await expect(service.execute(authUser, 5)).rejects.toThrow(
        AbsenceInternalErrorException,
      );
      expect(mockRepository.findAbsenceById).toHaveBeenCalledWith(3, 5);
      expect(mockRepository.deleteAbsence).toHaveBeenCalledWith(3, 5);
    });

    it('deve garantir que apenas o proprietário da falta possa deletá-la', async () => {
      const mockAbsence = new UserAbsence(
        5,
        new Date('2025-03-12'),
        new Date('2025-03-12T11:00:00'),
        999,
        7,
      );

      mockRepository.findAbsenceById.mockResolvedValue(mockAbsence);

      const differentAuthUser = {
        id: 10,
        email: 'different@example.com',
        name: 'Different User',
      };

      await expect(service.execute(differentAuthUser, 5)).rejects.toThrow(
        AbsenceUnauthorized,
      );
      expect(mockRepository.findAbsenceById).toHaveBeenCalledWith(10, 5);
      expect(mockRepository.deleteAbsence).not.toHaveBeenCalled();
    });
  });
});
