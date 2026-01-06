import { Test, TestingModule } from '@nestjs/testing';
import { DeleteActivityService } from '../services/delete-activity.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { PermissionDeniedToDeleteException } from '../exceptions/permission-denied-to-delete.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityDeleteException } from '../exceptions/activity-delete.exception';
import { Activity } from '../entities/activity.entity';

describe('DeleteActivityService', () => {
  let service: DeleteActivityService;
  let activitiesRepository: ActivitiesRepository;
  let subjectClassRepository: SubjectClassRepository;

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

  const mockActivitiesRepository = {
    findById: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockSubjectClassRepository = {
    findByIdAndUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteActivityService,
        {
          provide: ActivitiesRepository,
          useValue: mockActivitiesRepository,
        },
        {
          provide: SubjectClassRepository,
          useValue: mockSubjectClassRepository,
        },
      ],
    }).compile();

    service = module.get<DeleteActivityService>(DeleteActivityService);
    activitiesRepository =
      module.get<ActivitiesRepository>(ActivitiesRepository);
    subjectClassRepository = module.get<SubjectClassRepository>(
      SubjectClassRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve deletar uma atividade quando usuário é o dono', async () => {
      mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
      mockActivitiesRepository.softDelete.mockResolvedValue(undefined);

      await service.execute(mockAuthUser, 1);

      expect(activitiesRepository.findById).toHaveBeenCalledWith(1);
      expect(activitiesRepository.softDelete).toHaveBeenCalledWith(1);
      expect(subjectClassRepository.findByIdAndUserId).not.toHaveBeenCalled();
    });

    it('deve deletar uma atividade pública quando usuário está cadastrado na disciplina', async () => {
      const otherUserActivity = { ...mockActivity, userId: 999 };
      const mockSubjectClass = { id: 1, subjectId: 1 };

      mockActivitiesRepository.findById.mockResolvedValue(otherUserActivity);
      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(
        mockSubjectClass,
      );
      mockActivitiesRepository.softDelete.mockResolvedValue(undefined);

      await service.execute(mockAuthUser, 1);

      expect(activitiesRepository.findById).toHaveBeenCalledWith(1);
      expect(subjectClassRepository.findByIdAndUserId).toHaveBeenCalledWith(
        1,
        1,
      );
      expect(activitiesRepository.softDelete).toHaveBeenCalledWith(1);
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

      expect(activitiesRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deve lançar PermissionDeniedToDeleteException se atividade for privada e usuário não for dono', async () => {
      const privateActivity = { ...mockActivity, userId: 999, isPrivate: true };

      mockActivitiesRepository.findById.mockResolvedValue(privateActivity);

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        PermissionDeniedToDeleteException,
      );

      expect(activitiesRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deve lançar PermissionDeniedToDeleteException se usuário não estiver cadastrado na disciplina', async () => {
      const otherUserActivity = { ...mockActivity, userId: 999 };

      mockActivitiesRepository.findById.mockResolvedValue(otherUserActivity);
      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        PermissionDeniedToDeleteException,
      );

      expect(activitiesRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deve lançar ActivityDeleteException em caso de erro inesperado', async () => {
      mockActivitiesRepository.findById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        ActivityDeleteException,
      );
    });
  });
});
