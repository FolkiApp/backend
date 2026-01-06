import { Test, TestingModule } from '@nestjs/testing';
import { CheckActivityService } from '../services/check-activity.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityCheckException } from '../exceptions/activity-check.exception';
import { Activity } from '../entities/activity.entity';
import { UserActivityCheck } from '../entities/user-activity-check.entity';

describe('CheckActivityService', () => {
  let service: CheckActivityService;
  let activitiesRepository: ActivitiesRepository;

  const mockAuthUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    isAdmin: false,
    instituteId: 1,
    courseId: 2,
    universityId: 1,
    isBlocked: false,
    userVersion: '2.3.0',
  };

  const mockActivity = {
    id: 1,
    name: 'Trabalho de Cálculo',
    description: 'Resolver exercícios 1-10',
    finishDate: new Date('2025-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isPrivate: false,
    userId: 1,
    subjectClassId: 1,
    checked: false,
    subjectClass: {
      id: 1,
      year: 2025,
      subject: { id: 1, name: 'Cálculo I' },
    },
    user: { name: 'Test User' },
    ignored: false,
  } as Activity;

  const mockCheck: UserActivityCheck = {
    userId: 1,
    activityId: 1,
    createdAt: new Date(),
  };

  const mockActivitiesRepository = {
    findById: jest.fn(),
    createCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckActivityService,
        {
          provide: ActivitiesRepository,
          useValue: mockActivitiesRepository,
        },
      ],
    }).compile();

    service = module.get<CheckActivityService>(CheckActivityService);
    activitiesRepository =
      module.get<ActivitiesRepository>(ActivitiesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve marcar atividade como concluída com sucesso', async () => {
      mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
      mockActivitiesRepository.createCheck.mockResolvedValue(mockCheck);

      const result = await service.execute(mockAuthUser, 1);

      expect(result).toEqual(mockCheck);
      expect(activitiesRepository.findById).toHaveBeenCalledWith(1);
      expect(activitiesRepository.createCheck).toHaveBeenCalledWith(1, 1);
    });

    it('deve lançar UserBlockedException se usuário estiver bloqueado', async () => {
      const blockedUser = { ...mockAuthUser, isBlocked: true };

      await expect(service.execute(blockedUser, 1)).rejects.toThrow(
        UserBlockedException,
      );

      expect(activitiesRepository.findById).not.toHaveBeenCalled();
    });

    it('deve lançar ActivityNotFoundException se atividade não existir', async () => {
      mockActivitiesRepository.findById.mockResolvedValue(null);

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        ActivityNotFoundException,
      );

      expect(activitiesRepository.createCheck).not.toHaveBeenCalled();
    });

    it('deve lançar ActivityCheckException em caso de erro ao buscar atividade', async () => {
      mockActivitiesRepository.findById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        ActivityCheckException,
      );
    });

    it('deve lançar ActivityCheckException em caso de erro ao criar check', async () => {
      mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
      mockActivitiesRepository.createCheck.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        ActivityCheckException,
      );
    });
  });
});
