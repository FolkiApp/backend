import { Test, TestingModule } from '@nestjs/testing';
import { ImportantDateController } from '../important-date.controller';
import { FindAllImportantDateService } from '../services/find-all-important-date.service';
import { ImportantDateResponseDto } from '../dtos/important-date.dto';
import { ImportDateType } from '@prisma/client';
import type { AuthUser } from '../../common/guards/auth.guard';

describe('ImportantDateController', () => {
  let controller: ImportantDateController;
  let findAllImportantDateService: FindAllImportantDateService;

  const mockFindAllImportantDateService = {
    execute: jest.fn(),
  };

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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportantDateController],
      providers: [
        {
          provide: FindAllImportantDateService,
          useValue: mockFindAllImportantDateService,
        },
      ],
    }).compile();

    controller = module.get<ImportantDateController>(ImportantDateController);
    findAllImportantDateService = module.get<FindAllImportantDateService>(
      FindAllImportantDateService,
    );
  });

  describe('findAll', () => {
    it('deve retornar lista de ImportantDateResponseDto para o usuário autenticado', async () => {
      mockFindAllImportantDateService.execute.mockResolvedValue(
        mockImportantDates,
      );

      const result = await controller.findAll(authUser);

      expect(result).toHaveLength(mockImportantDates.length);

      // Verifica que todos os itens são instâncias do DTO e mapeados corretamente
      result.forEach((dto, index) => {
        const date = mockImportantDates[index];
        expect(dto).toBeInstanceOf(ImportantDateResponseDto);
        expect(dto).toMatchObject({
          id: date.id,
          name: date.name,
          date: date.date,
          type: date.type,
          shouldNotify: date.shouldNotify,
          campusId: date.campusId,
          universityId: date.universityId,
        });
      });

      expect(findAllImportantDateService.execute).toHaveBeenCalledWith(
        authUser,
      );
      expect(findAllImportantDateService.execute).toHaveBeenCalledTimes(1);
    });
  });
});
