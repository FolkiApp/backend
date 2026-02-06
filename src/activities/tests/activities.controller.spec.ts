import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from '../activities.controller';
import { GetAllActivitiesService } from '../services/get-all-activities.service';
import { CreateActivityService } from '../services/create-activity.service';
import { UpdateActivityService } from '../services/update-activity.service';
import { DeleteActivityService } from '../services/delete-activity.service';
import { CheckActivityService } from '../services/check-activity.service';
import { UncheckActivityService } from '../services/uncheck-activity.service';
import { IgnoreActivityService } from '../services/ignore-activity.service';
import { UnignoreActivityService } from '../services/unignore-activity.service';
import { Activity } from '../entities/activity.entity';
import { ActivityType } from '../dto/create-activity.dto';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let getAllActivitiesService: GetAllActivitiesService;

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

  const mockGetAllActivitiesService = {
    execute: jest.fn(),
  };

  const mockCreateActivityService = {
    execute: jest.fn(),
  };

  const mockUpdateActivityService = {
    execute: jest.fn(),
  };

  const mockDeleteActivityService = {
    execute: jest.fn(),
  };

  const mockCheckActivityService = {
    execute: jest.fn(),
  };

  const mockUncheckActivityService = {
    execute: jest.fn(),
  };

  const mockIgnoreActivityService = {
    execute: jest.fn(),
  };

  const mockUnignoreActivityService = {
    execute: jest.fn(),
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
      controllers: [ActivitiesController],
      providers: [
        {
          provide: GetAllActivitiesService,
          useValue: mockGetAllActivitiesService,
        },
        {
          provide: CreateActivityService,
          useValue: mockCreateActivityService,
        },
        {
          provide: UpdateActivityService,
          useValue: mockUpdateActivityService,
        },
        {
          provide: DeleteActivityService,
          useValue: mockDeleteActivityService,
        },
        {
          provide: CheckActivityService,
          useValue: mockCheckActivityService,
        },
        {
          provide: UncheckActivityService,
          useValue: mockUncheckActivityService,
        },
        {
          provide: IgnoreActivityService,
          useValue: mockIgnoreActivityService,
        },
        {
          provide: UnignoreActivityService,
          useValue: mockUnignoreActivityService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    getAllActivitiesService = module.get<GetAllActivitiesService>(
      GetAllActivitiesService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de atividades formatadas', async () => {
      const currentYear = new Date().getFullYear();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockActivities = [
        {
          id: 1,
          name: 'Trabalho de Cálculo',
          description: 'Resolver exercícios 1-10',
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
      ];

      mockGetAllActivitiesService.execute.mockResolvedValue(mockActivities);

      const result = await controller.findAll(mockAuthUser);

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].name).toBe('Trabalho de Cálculo');
      expect(result.activities[0].checked).toBe(false);
      expect(result.activities[0].subjectClass.subject.name).toBe('Cálculo I');
      expect(getAllActivitiesService.execute).toHaveBeenCalledWith(
        mockAuthUser,
      );
    });

    it('deve retornar lista vazia quando não houver atividades', async () => {
      mockGetAllActivitiesService.execute.mockResolvedValue([]);

      const result = await controller.findAll(mockAuthUser);

      expect(result.activities).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('deve criar uma nova atividade', async () => {
      const createDto = {
        name: 'Nova Atividade',
        description: 'Descrição',
        value: 10,
        type: ActivityType.EXAM,
        finishDate: '2025-12-31',
        subjectClassId: 1,
        isPrivate: false,
      };

      const mockActivity = {
        id: 1,
        name: createDto.name,
        description: createDto.description,
        finishDate: new Date(createDto.finishDate),
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

      mockCreateActivityService.execute.mockResolvedValue(mockActivity);

      const result = await controller.create(mockAuthUser, createDto);

      expect(result.name).toBe(createDto.name);
      expect(mockCreateActivityService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        createDto,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma atividade', async () => {
      const updateDto = {
        name: 'Atividade Atualizada',
      };

      const mockActivity = {
        id: 1,
        name: updateDto.name,
        description: 'Descrição',
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

      mockUpdateActivityService.execute.mockResolvedValue(mockActivity);

      const result = await controller.update(mockAuthUser, '1', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(mockUpdateActivityService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        1,
        updateDto,
      );
    });
  });

  describe('delete', () => {
    it('deve deletar uma atividade', async () => {
      mockDeleteActivityService.execute.mockResolvedValue(undefined);

      await controller.delete(mockAuthUser, '1');

      expect(mockDeleteActivityService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        1,
      );
    });
  });

  describe('check', () => {
    it('deve marcar atividade como concluída', async () => {
      mockCheckActivityService.execute.mockResolvedValue(undefined);

      await controller.check(mockAuthUser, '1');

      expect(mockCheckActivityService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        1,
      );
    });
  });

  describe('uncheck', () => {
    it('deve desmarcar atividade como concluída', async () => {
      mockUncheckActivityService.execute.mockResolvedValue(undefined);

      await controller.uncheck(mockAuthUser, '1');

      expect(mockUncheckActivityService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        1,
      );
    });
  });

  describe('ignore', () => {
    it('deve marcar atividade como ignorada', async () => {
      mockIgnoreActivityService.execute.mockResolvedValue(undefined);

      await controller.ignore(mockAuthUser, '1');

      expect(mockIgnoreActivityService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        1,
      );
    });
  });

  describe('unignore', () => {
    it('deve desmarcar atividade como ignorada', async () => {
      mockUnignoreActivityService.execute.mockResolvedValue(undefined);

      await controller.unignore(mockAuthUser, '1');

      expect(mockUnignoreActivityService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        1,
      );
    });
  });
});
