import { Test, TestingModule } from '@nestjs/testing';
import { UpdateActivityService } from '../services/update-activity.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { ActivityType } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { AuthUser } from '../../common/guards/auth.guard';

describe('UpdateActivityService', () => {
  let service: UpdateActivityService;

  const mockActivitiesRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockSubjectClassRepository = {
    findByIdAndUserId: jest.fn(),
    findByIdWithSubject: jest.fn(),
  };

  const mockUserSubjectsRepository = {
    getUserIdsBySubjectClassId: jest.fn(),
  };

  const mockNotificationQueueService = {
    addNotificationJob: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockUser: AuthUser = {
    id: 1,
    isBlocked: false,
  } as AuthUser;

  // 🔥 CORRIGIDO AQUI
  const mockActivity = {
    id: 10,
    name: 'Prova 1',
    description: 'Prova final',
    value: 10,
    type: ActivityType.EXAM,
    finishDate: new Date('2025-12-01'), // <-- horário zerado
    isPrivate: false,
    subjectClassId: 5,
  };

  function makeUpdateDto(
    override?: Partial<UpdateActivityDto>,
  ): UpdateActivityDto {
    return {
      name: 'Nova Prova',
      description: 'Descrição atualizada',
      value: 10,
      type: ActivityType.EXAM,
      finishDate: '2025-12-01',
      isPrivate: false,
      ...override,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateActivityService,
        { provide: ActivitiesRepository, useValue: mockActivitiesRepository },
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
        { provide: CustomLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UpdateActivityService>(UpdateActivityService);
    jest.clearAllMocks();
  });

  it('NÃO deve enviar notificação se data não mudar', async () => {
    mockActivitiesRepository.findById.mockResolvedValue(mockActivity);
    mockSubjectClassRepository.findByIdAndUserId.mockResolvedValue({});
    mockActivitiesRepository.update.mockResolvedValue(mockActivity);

    await service.execute(
      mockUser,
      10,
      makeUpdateDto({ finishDate: '2025-12-01' }),
    );

    expect(
      mockNotificationQueueService.addNotificationJob,
    ).not.toHaveBeenCalled();
  });
});
