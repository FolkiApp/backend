import { Test, TestingModule } from '@nestjs/testing';
import { ImportanteDateController } from '../important-date.controller';
import { FindAllImportantDate } from '../services/find-all-important-date.service';
import { ImportantDateResponseDto } from '../dtos/important-date.dto';
import { ImportDateType } from '@prisma/client';
import type { AuthUser } from 'src/common/guards/auth.guard';

describe('ImportanteDateController', () => {
  let controller: ImportanteDateController;
  let findAllImportantDateService: FindAllImportantDate;

  const mockFindAllImportantDateService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportanteDateController],
      providers: [
        {
          provide: FindAllImportantDate,
          useValue: mockFindAllImportantDateService,
        },
      ],
    }).compile();

    controller = module.get<ImportanteDateController>(ImportanteDateController);
    findAllImportantDateService =
      module.get<FindAllImportantDate>(FindAllImportantDate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getImportantDates', () => {
    it('deve retornar uma lista de datas importantes para o usuário autenticado', async () => {
      const authUser: AuthUser = {
        id: 1,
        email: 'user@test.com',
        name: 'User Test',
        instituteId: 10,
        courseId: 5,
        isAdmin: false,
        isBlocked: false,
        universityId: 20,
        userVersion: '1.0.0',
      };

      const mockImportantDates = [
        {
          id: 1,
          name: 'Início do semestre',
          date: new Date('2025-02-10'),
          type: ImportDateType.GENERAL,
          shouldNotify: true,
          campusId: 5,
          universityId: 20,
        },
        {
          id: 2,
          name: 'Feriado Nacional',
          date: new Date('2025-04-21'),
          type: ImportDateType.DAY_OFF,
          shouldNotify: false,
          campusId: null,
          universityId: 20,
        },
      ];

      mockFindAllImportantDateService.execute.mockResolvedValue(
        mockImportantDates,
      );

      const result = await controller.findAll(authUser);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ImportantDateResponseDto);
      expect(result[0].id).toBe(mockImportantDates[0].id);
      expect(result[0].name).toBe(mockImportantDates[0].name);
      expect(result[1].campusId).toBeNull();

      expect(findAllImportantDateService.execute).toHaveBeenCalledWith(
        authUser,
      );
      expect(findAllImportantDateService.execute).toHaveBeenCalledTimes(1);
    });
  });
});
