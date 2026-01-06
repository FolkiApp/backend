import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('ActivitiesRepository', () => {
  let repository: ActivitiesRepository;

  const mockPrismaService = {
    activity: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ActivitiesRepository>(ActivitiesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('deve retornar atividades do usuário com checks e ignores', async () => {
      const mockPrismaActivities = [
        {
          id: 1,
          name: 'Trabalho',
          description: 'Descrição',
          finishDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isPrivate: false,
          userId: 1,
          subjectClassId: 1,
          subjectClass: {
            id: 1,
            year: 2025,
            subject: {
              id: 1,
              name: 'Cálculo I',
            },
          },
          user: {
            name: 'João Silva',
          },
          user_activity_check: [
            {
              userId: 1,
              activityId: 1,
              createdAt: new Date(),
            },
          ],
          user_activity_ignore: [],
        },
      ];

      mockPrismaService.activity.findMany.mockResolvedValue(
        mockPrismaActivities,
      );

      const result = await repository.findAllByUser(1, 2025);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Trabalho');
      expect(result[0].subjectClass?.subject?.name).toBe('Cálculo I');
      expect(result[0].checked).toBe(true);
      expect(result[0].ignored).toBe(false);
    });
  });
});
