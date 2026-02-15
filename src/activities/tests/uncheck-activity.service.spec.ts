import { Test, TestingModule } from '@nestjs/testing';
import { UncheckActivityService } from '../services/uncheck-activity.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityUncheckException } from '../exceptions/activity-uncheck.exception';
import { Activity } from '../entities/activity.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('UncheckActivityService', () => {
  let service: UncheckActivityService;
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
    checked: true,
    subjectClass: {
      id: 1,
      year: 2025,
      subject: { id: 1, name: 'Cálculo I' },
    },
    user: { name: 'Test User' },
    ignored: false,
  } as Activity;

  const mockActivitiesRepository = {
    findById: jest.fn(),
    deleteCheck: jest.fn(),
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
        UncheckActivityService,
        {
          provide: ActivitiesRepository,
          useValue: mockActivitiesRepository,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<UncheckActivityService>(UncheckActivityService);
    activitiesRepository =
      module.get<ActivitiesRepository>(ActivitiesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve desmarcar atividade como concluída com sucesso', async () => {
      mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
      mockActivitiesRepository.deleteCheck.mockResolvedValue(undefined);

      await service.execute(mockAuthUser, 1);

      expect(activitiesRepository.findById).toHaveBeenCalledWith(1);
      expect(activitiesRepository.deleteCheck).toHaveBeenCalledWith(1, 1);
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

      expect(activitiesRepository.deleteCheck).not.toHaveBeenCalled();
    });

    it('deve lançar ActivityUncheckException em caso de erro ao buscar atividade', async () => {
      mockActivitiesRepository.findById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        ActivityUncheckException,
      );
    });

    it('deve lançar ActivityUncheckException em caso de erro ao deletar check', async () => {
      mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
      mockActivitiesRepository.deleteCheck.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        ActivityUncheckException,
      );
    });
  });
});
