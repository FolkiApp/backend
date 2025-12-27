import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserAbsence } from '../entities/absence.entity';

describe('AbsenceRepository', () => {
  let repository: AbsenceRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user_absence: {
      findMany: jest.fn(),
    },
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
});
