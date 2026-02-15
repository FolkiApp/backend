import { Test, TestingModule } from '@nestjs/testing';
import { CreateActivityService } from '../services/create-activity.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { CreateActivityDto, ActivityType } from '../dto/create-activity.dto';
import { InvalidSubjectClassException } from '../exceptions/invalid-subject-class.exception';
import { ActivityAlreadyExistsException } from '../exceptions/activity-already-exists.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { ActivityCreateException } from '../exceptions/activity-create.exception';
import { Activity } from '../entities/activity.entity';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { PipoNotificationService } from '../../notifications/services/pipo-notification.service';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('CreateActivityService', () => {
  let service: CreateActivityService;
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

  const mockCreateActivityDto: CreateActivityDto = {
    name: 'Trabalho de Cálculo',
    description: 'Resolver exercícios 1-10',
    value: 10,
    subjectClassId: 1,
    type: ActivityType.HOMEWORK,
    finishDate: '2025-12-31',
    isPrivate: false,
  };

  const mockActivitiesRepository = {
    findActivityByTypeAndDate: jest.fn(),
    createActivity: jest.fn(),
  };

  const mockSubjectClassRepository = {
    findByIdAndUserId: jest.fn(),
    findByIdWithSubject: jest.fn(),
  };

  const mockUserSubjectsRepository = {
    getNotificationIdsBySubjectClassId: jest.fn(),
    getUserIdsBySubjectClassId: jest.fn(),
  };

  const mockNotificationQueueService = {
    addNotificationJob: jest.fn(),
  };

  const mockPipoNotificationService = {
    sendNotification: jest.fn(),
  };

  const mockCustomLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateActivityService,
        {
          provide: ActivitiesRepository,
          useValue: mockActivitiesRepository,
        },
        {
          provide: SubjectClassRepository,
          useValue: mockSubjectClassRepository,
        },
        {
          provide: UserSubjectsRepository,
          useValue: mockUserSubjectsRepository,
        },
        {
          provide: NotificationQueueService,
          useValue: mockNotificationQueueService,
        },
        {
          provide: PipoNotificationService,
          useValue: mockPipoNotificationService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<CreateActivityService>(CreateActivityService);
    activitiesRepository =
      module.get<ActivitiesRepository>(ActivitiesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve criar uma atividade com sucesso', async () => {
      const mockSubjectClass = { id: 1, subjectId: 1 };
      const mockActivity = {
        id: 1,
        name: mockCreateActivityDto.name,
        description: mockCreateActivityDto.description,
        finishDate: new Date(mockCreateActivityDto.finishDate),
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

      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(
        mockSubjectClass,
      );
      mockActivitiesRepository.findActivityByTypeAndDate.mockResolvedValue(
        null,
      );
      mockActivitiesRepository.createActivity.mockResolvedValue(mockActivity);

      const result = await service.execute(mockAuthUser, mockCreateActivityDto);

      expect(result).toEqual(mockActivity);
      expect(mockSubjectClassRepository.findByIdAndUserId).toHaveBeenCalledWith(
        1,
        1,
      );
      expect(activitiesRepository.createActivity).toHaveBeenCalledWith(
        1,
        mockCreateActivityDto.name,
        mockCreateActivityDto.description,
        mockCreateActivityDto.value,
        mockCreateActivityDto.subjectClassId,
        mockCreateActivityDto.type,
        expect.any(Date),
        mockCreateActivityDto.isPrivate,
      );
      expect(
        activitiesRepository.findActivityByTypeAndDate,
      ).toHaveBeenCalledWith(1, ActivityType.HOMEWORK, expect.any(Date));
    });

    it('deve lançar UserBlockedException se usuário estiver bloqueado', async () => {
      const blockedUser = { ...mockAuthUser, isBlocked: true };

      await expect(
        service.execute(blockedUser, mockCreateActivityDto),
      ).rejects.toThrow(UserBlockedException);

      expect(
        mockSubjectClassRepository.findByIdAndUserId,
      ).not.toHaveBeenCalled();
    });

    it('deve lançar InvalidSubjectClassException se disciplina não existir', async () => {
      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.execute(mockAuthUser, mockCreateActivityDto),
      ).rejects.toThrow(InvalidSubjectClassException);

      expect(
        activitiesRepository.findActivityByTypeAndDate,
      ).not.toHaveBeenCalled();
    });

    it('deve lançar ActivityAlreadyExistsException se atividade pública já existir', async () => {
      const mockSubjectClass = { id: 1, subjectId: 1 };
      const existingActivity = {
        id: 2,
        name: 'Existing Activity',
      } as Activity;

      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(
        mockSubjectClass,
      );
      mockActivitiesRepository.findActivityByTypeAndDate.mockResolvedValue(
        existingActivity,
      );

      await expect(
        service.execute(mockAuthUser, mockCreateActivityDto),
      ).rejects.toThrow(ActivityAlreadyExistsException);

      expect(activitiesRepository.createActivity).not.toHaveBeenCalled();
    });

    it('deve permitir criar atividade privada mesmo se já existir pública', async () => {
      const privateActivityDto = { ...mockCreateActivityDto, isPrivate: true };
      const mockSubjectClass = { id: 1, subjectId: 1 };
      const mockActivity = {
        id: 1,
        name: privateActivityDto.name,
        isPrivate: true,
      } as Activity;

      mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue(
        mockSubjectClass,
      );
      mockActivitiesRepository.createActivity.mockResolvedValue(mockActivity);

      const result = await service.execute(mockAuthUser, privateActivityDto);

      expect(result).toEqual(mockActivity);
      expect(
        activitiesRepository.findActivityByTypeAndDate,
      ).not.toHaveBeenCalled();
    });

    it('deve lançar ActivityCreateException em caso de erro inesperado', async () => {
      mockSubjectClassRepository.findByIdAndUserId.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.execute(mockAuthUser, mockCreateActivityDto),
      ).rejects.toThrow(ActivityCreateException);
    });
  });
});
