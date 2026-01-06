import { Test, TestingModule } from '@nestjs/testing';
import { UpdateActivityService } from '../services/update-activity.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { ActivityNotFoundException } from '../exceptions/activity-not-found.exception';
import { PermissionDeniedToUpdateException } from '../exceptions/permission-denied-to-update.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityUpdateException } from '../exceptions/activity-update.exception';
import { Activity } from '../entities/activity.entity';

describe('UpdateActivityService', () => {
  let service: UpdateActivityService;
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

  const mockUpdateActivityDto: UpdateActivityDto = {
    name: 'Trabalho de Cálculo Atualizado',
    description: 'Resolver exercícios 1-20',
  };

  const mockActivitiesRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockSubjectClassRepository = {
    findByIdAndUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateActivityService,
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

    service = module.get<UpdateActivityService>(UpdateActivityService);
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
    it('deve atualizar uma atividade com sucesso', async () => {
      const mockSubjectClass = { id: 1, subjectId: 1 };
      const updatedActivity = { ...mockActivity, ...mockUpdateActivityDto };

      mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(
        mockSubjectClass,
      );
      mockActivitiesRepository.update.mockResolvedValue(updatedActivity);

      const result = await service.execute(
        mockAuthUser,
        1,
        mockUpdateActivityDto,
      );

      expect(result).toEqual(updatedActivity);
      expect(activitiesRepository.findById).toHaveBeenCalledWith(1);
      expect(subjectClassRepository.findByIdAndUserId).toHaveBeenCalledWith(
        1,
        1,
      );
      expect(activitiesRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: mockUpdateActivityDto.name,
          description: mockUpdateActivityDto.description,
        }),
      );
    });

    it('deve lançar UserBlockedException se usuário estiver bloqueado', async () => {
      const blockedUser = { ...mockAuthUser, isBlocked: true };

      await expect(
        service.execute(blockedUser, 1, mockUpdateActivityDto),
      ).rejects.toThrow(UserBlockedException);

      expect(activitiesRepository.findById).not.toHaveBeenCalled();
    });

    it('deve lançar ActivityNotFoundException se atividade não existir', async () => {
      mockActivitiesRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute(mockAuthUser, 1, mockUpdateActivityDto),
      ).rejects.toThrow(ActivityNotFoundException);

      expect(subjectClassRepository.findByIdAndUserId).not.toHaveBeenCalled();
    });

    it('deve lançar PermissionDeniedToUpdateException se usuário não estiver cadastrado na disciplina', async () => {
      mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.execute(mockAuthUser, 1, mockUpdateActivityDto),
      ).rejects.toThrow(PermissionDeniedToUpdateException);

      expect(activitiesRepository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar atividade com data usando horário padrão de 15h', async () => {
      const mockSubjectClass = { id: 1, subjectId: 1 };
      const updateWithDate: UpdateActivityDto = {
        ...mockUpdateActivityDto,
        finishDate: '2026-01-15',
      };
      const updatedActivity = { ...mockActivity, ...updateWithDate };

      mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(
        mockSubjectClass,
      );
      mockActivitiesRepository.update.mockResolvedValue(updatedActivity);

      await service.execute(mockAuthUser, 1, updateWithDate);

      expect(activitiesRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: updateWithDate.name,
          description: updateWithDate.description,
        }),
      );
    });

    it('deve lançar ActivityUpdateException em caso de erro inesperado', async () => {
      mockActivitiesRepository.findById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.execute(mockAuthUser, 1, mockUpdateActivityDto),
      ).rejects.toThrow(ActivityUpdateException);
    });
  });
});
