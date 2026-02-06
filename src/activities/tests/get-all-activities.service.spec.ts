import { Test, TestingModule } from '@nestjs/testing';
import { GetAllActivitiesService } from '../services/get-all-activities.service';
import { ActivitiesRepository } from '../repositories/activities.repository';
import { Activity } from '../entities/activity.entity';
import { ActivitiesFetchException } from '../exceptions/activities-fetch.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('GetAllActivitiesService', () => {
  let service: GetAllActivitiesService;
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

  const mockActivitiesRepository = {
    findAllByUser: jest.fn(),
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
        GetAllActivitiesService,
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

    service = module.get<GetAllActivitiesService>(GetAllActivitiesService);
    activitiesRepository =
      module.get<ActivitiesRepository>(ActivitiesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar todas as atividades do usuário ordenadas', async () => {
      const currentYear = new Date().getFullYear();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockActivities = [
        {
          id: 1,
          name: 'Atividade Futura',
          description: 'Descrição',
          finishDate: tomorrow,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isPrivate: false,
          userId: 1,
          subjectClassId: 1,
          checked: false,
          subjectClass: {
            id: 1,
            year: currentYear,
            subject: { id: 1, name: 'Cálculo I' },
          },
          user: { name: 'João Silva' },
          ignored: false,
        } as Activity,
        {
          id: 2,
          name: 'Atividade Passada',
          description: 'Descrição',
          finishDate: yesterday,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isPrivate: false,
          userId: 1,
          subjectClassId: 1,
          checked: true,
          subjectClass: {
            id: 1,
            year: currentYear,
            subject: { id: 1, name: 'Cálculo I' },
          },
          user: { name: 'João Silva' },
          ignored: false,
        } as Activity,
      ];

      mockActivitiesRepository.findAllByUser.mockResolvedValue(mockActivities);

      const result = await service.execute(mockAuthUser);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Atividade Futura');
      expect(result[1].name).toBe('Atividade Passada');
      expect(result[1].checked).toBe(true);
      expect(activitiesRepository.findAllByUser).toHaveBeenCalledWith(
        1,
        currentYear,
      );
    });

    it('deve lançar ActivitiesFetchException em caso de erro', async () => {
      mockActivitiesRepository.findAllByUser.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser)).rejects.toThrow(
        ActivitiesFetchException,
      );
    });
  });
});
