import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserAbsence } from '../entities/absence.entity';
import { AbsenceUnauthorized } from '../exceptions/absence-unauthorized.exception';

describe('AbsenceRepository', () => {
  let repository: AbsenceRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user_absence: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user_subject: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbsenceRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AbsenceRepository>(AbsenceRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findBySubject', () => {
    it('deve retornar múltiplas faltas de um usuário em uma disciplina', async () => {
      const mockAbsences = [
        {
          id: 1,
          date: new Date('2025-03-10'),
          createdAt: new Date('2025-03-10T12:30:00'),
          userId: 3,
          userSubjectId: 7,
        },
        {
          id: 2,
          date: new Date('2025-03-15'),
          createdAt: new Date('2025-03-15T10:00:00'),
          userId: 3,
          userSubjectId: 7,
        },
      ];

      mockPrismaService.user_absence.findMany.mockResolvedValue(mockAbsences);

      const result = await repository.findBySubject(3, 7);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserAbsence);
      expect(result[0].id).toBe(1);
      expect(result[0].userId).toBe(3);
      expect(result[0].userSubjectId).toBe(7);
      expect(prismaService.user_absence.findMany).toHaveBeenCalledWith({
        where: { userId: 3, userSubjectId: 7 },
        orderBy: { date: 'desc' },
      });
    });

    it('deve retornar array vazio quando o usuário não tem faltas na disciplina', async () => {
      mockPrismaService.user_absence.findMany.mockResolvedValue([]);

      const result = await repository.findBySubject(3, 7);

      expect(result).toEqual([]);
      expect(prismaService.user_absence.findMany).toHaveBeenCalledWith({
        where: { userId: 3, userSubjectId: 7 },
        orderBy: { date: 'desc' },
      });
    });

    it('deve retornar faltas ordenadas por data em ordem decrescente', async () => {
      const mockAbsences = [
        {
          id: 3,
          date: new Date('2025-03-20'),
          createdAt: new Date('2025-03-20T08:00:00'),
          userId: 5,
          userSubjectId: 10,
        },
        {
          id: 2,
          date: new Date('2025-03-10'),
          createdAt: new Date('2025-03-10T12:30:00'),
          userId: 5,
          userSubjectId: 10,
        },
        {
          id: 1,
          date: new Date('2025-02-25'),
          createdAt: new Date('2025-02-25T14:15:00'),
          userId: 5,
          userSubjectId: 10,
        },
      ];

      mockPrismaService.user_absence.findMany.mockResolvedValue(mockAbsences);

      const result = await repository.findBySubject(5, 10);

      expect(result).toHaveLength(3);
      expect(result[0].date).toEqual(new Date('2025-03-20'));
      expect(result[1].date).toEqual(new Date('2025-03-10'));
      expect(result[2].date).toEqual(new Date('2025-02-25'));
    });
  });

  describe('postAbsence', () => {
    it('deve criar uma falta e atualizar contagem de faltas', async () => {
      const created = {
        id: 10,
        date: new Date('2025-04-01'),
        createdAt: new Date('2025-04-01T09:00:00'),
        userId: 3,
        userSubjectId: 7,
      };

      // prisma.$transaction resolves to an array where first item is the created record
      mockPrismaService.$transaction.mockResolvedValue([created, {}]);

      const result = await repository.postAbsence(3, 7, new Date('2025-04-01'));

      expect(result).toBeInstanceOf(UserAbsence);
      expect(result.id).toBe(10);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.user_absence.create).toHaveBeenCalledWith({
        data: { userSubjectId: 7, date: new Date('2025-04-01'), userId: 3 },
      });
      expect(prismaService.user_subject.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { absences: { increment: 1 } },
      });
    });

    it('deve propagar erro quando a transação falha', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('DB error'));

      await expect(
        repository.postAbsence(3, 7, new Date('2025-04-01')),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findAbsenceById', () => {
    it('deve retornar uma falta específica do usuário pelo id', async () => {
      const mockAbsence = {
        id: 5,
        date: new Date('2025-03-12'),
        createdAt: new Date('2025-03-12T11:00:00'),
        userId: 3,
        userSubjectId: 7,
      };

      mockPrismaService.user_absence.findFirst = jest
        .fn()
        .mockResolvedValue(mockAbsence);

      const result = await repository.findAbsenceById(3, 5);

      expect(result).toBeInstanceOf(UserAbsence);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(5);
      expect(result!.userId).toBe(3);
      expect(result!.userSubjectId).toBe(7);
      expect(mockPrismaService.user_absence.findFirst).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    it('deve retornar null quando a falta não existe', async () => {
      mockPrismaService.user_absence.findFirst = jest
        .fn()
        .mockResolvedValue(null);

      const result = await repository.findAbsenceById(3, 999);

      expect(result).toBeNull();
      expect(mockPrismaService.user_absence.findFirst).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('deve lançar AbsenceUnauthorized quando a falta pertence a outro usuário', async () => {
      const mockAbsence = {
        id: 5,
        date: new Date('2025-03-12'),
        createdAt: new Date('2025-03-12T11:00:00'),
        userId: 999,
        userSubjectId: 7,
      };

      mockPrismaService.user_absence.findFirst = jest
        .fn()
        .mockResolvedValue(mockAbsence);

      await expect(repository.findAbsenceById(3, 5)).rejects.toThrow(
        AbsenceUnauthorized,
      );
      expect(mockPrismaService.user_absence.findFirst).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    it('deve propagar erro quando ocorre falha na busca', async () => {
      mockPrismaService.user_absence.findFirst = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      await expect(repository.findAbsenceById(3, 5)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('deleteAbsence', () => {
    it('deve deletar uma falta e decrementar contagem do usuário na disciplina', async () => {
      const deletedAbsence = {
        id: 5,
        date: new Date('2025-03-12'),
        createdAt: new Date('2025-03-12T11:00:00'),
        userId: 3,
        userSubjectId: 7,
      };

      const mockPrismaTransaction = {
        user_absence: {
          delete: jest.fn().mockResolvedValue(deletedAbsence),
        },
        user_subject: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: typeof mockPrismaTransaction) => Promise<void>) =>
          callback(mockPrismaTransaction),
      );

      await repository.deleteAbsence(3, 5);

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('deve propagar erro quando tenta deletar falta que não existe', async () => {
      const mockPrismaTransaction = {
        user_absence: {
          delete: jest
            .fn()
            .mockRejectedValue(new Error('Record to delete does not exist.')),
        },
      };

      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: typeof mockPrismaTransaction) => Promise<void>) =>
          callback(mockPrismaTransaction),
      );

      await expect(repository.deleteAbsence(3, 999)).rejects.toThrow(
        'Record to delete does not exist.',
      );
    });

    it('deve propagar erro quando ocorre falha na atualização do contador', async () => {
      const deletedAbsence = {
        id: 5,
        date: new Date('2025-03-12'),
        createdAt: new Date('2025-03-12T11:00:00'),
        userId: 3,
        userSubjectId: 7,
      };

      const mockPrismaTransaction = {
        user_absence: {
          delete: jest.fn().mockResolvedValue(deletedAbsence),
        },
        user_subject: {
          update: jest.fn().mockRejectedValue(new Error('Update failed')),
        },
      };

      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: typeof mockPrismaTransaction) => Promise<void>) =>
          callback(mockPrismaTransaction),
      );

      await expect(repository.deleteAbsence(3, 5)).rejects.toThrow(
        'Update failed',
      );
    });
  });
});
