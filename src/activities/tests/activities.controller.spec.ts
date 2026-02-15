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
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { AuthUser } from '../../common/guards/auth.guard';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;

  const mockAuthUser: AuthUser = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    isAdmin: false,
    instituteId: 1,
    courseId: 2,
    universityId: 1,
    isBlocked: false,
    userVersion: '2.3.0',
  } as AuthUser;

  const mockGetAllActivitiesService = { execute: jest.fn() };
  const mockCreateActivityService = { execute: jest.fn() };
  const mockUpdateActivityService = { execute: jest.fn() };
  const mockDeleteActivityService = { execute: jest.fn() };
  const mockCheckActivityService = { execute: jest.fn() };
  const mockUncheckActivityService = { execute: jest.fn() };
  const mockIgnoreActivityService = { execute: jest.fn() };
  const mockUnignoreActivityService = { execute: jest.fn() };

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
        { provide: CreateActivityService, useValue: mockCreateActivityService },
        { provide: UpdateActivityService, useValue: mockUpdateActivityService },
        { provide: DeleteActivityService, useValue: mockDeleteActivityService },
        { provide: CheckActivityService, useValue: mockCheckActivityService },
        {
          provide: UncheckActivityService,
          useValue: mockUncheckActivityService,
        },
        { provide: IgnoreActivityService, useValue: mockIgnoreActivityService },
        {
          provide: UnignoreActivityService,
          useValue: mockUnignoreActivityService,
        },
        { provide: CustomLogger, useValue: mockCustomLogger },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('deve atualizar uma atividade', async () => {
      const updateDto: UpdateActivityDto = {
        name: 'Atividade Atualizada',
      };

      const mockActivity = {
        id: 1,
        name: updateDto.name,
        description: 'Descrição',
        value: 10,
        type: ActivityType.EXAM,
        finishDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        isPrivate: false,
        userId: 1,
        subjectClassId: 1,
        checked: false,
        ignored: false,
        subjectClass: {
          id: 1,
          year: 2025,
          subject: { id: 1, name: 'Cálculo I' },
        },
        user: { name: 'Test User' },
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
});
