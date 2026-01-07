import { Test, TestingModule } from '@nestjs/testing';
import { GradesController } from '../grades.controller';
import { GetAllGradesFromSubjectService } from '../services/get-all-grades-from-subject.service';
import { CreateGradeService } from '../services/create-grade.service';
import { DeleteGradeService } from '../services/delete-grade.service';
import { Grade } from '../entities/grade.entity';
import { CreateGradeDto } from '../dto/create-grade.dto';

describe('GradesController', () => {
  let controller: GradesController;
  let getAllGradesFromSubjectService: GetAllGradesFromSubjectService;
  let createGradeService: CreateGradeService;
  let deleteGradeService: DeleteGradeService;

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

  const mockGetAllGradesFromSubjectService = {
    execute: jest.fn(),
  };

  const mockCreateGradeService = {
    execute: jest.fn(),
  };

  const mockDeleteGradeService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradesController],
      providers: [
        {
          provide: GetAllGradesFromSubjectService,
          useValue: mockGetAllGradesFromSubjectService,
        },
        {
          provide: CreateGradeService,
          useValue: mockCreateGradeService,
        },
        {
          provide: DeleteGradeService,
          useValue: mockDeleteGradeService,
        },
      ],
    }).compile();

    controller = module.get<GradesController>(GradesController);
    getAllGradesFromSubjectService = module.get<GetAllGradesFromSubjectService>(
      GetAllGradesFromSubjectService,
    );
    createGradeService = module.get<CreateGradeService>(CreateGradeService);
    deleteGradeService = module.get<DeleteGradeService>(DeleteGradeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de notas formatadas', async () => {
      const mockGrades = [
        {
          id: 1,
          name: 'Prova 1',
          value: 8.5,
          weight: 2,
          userSubjectId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Grade,
        {
          id: 2,
          name: 'Trabalho 1',
          value: 9.0,
          weight: 1,
          userSubjectId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Grade,
      ];

      mockGetAllGradesFromSubjectService.execute.mockResolvedValue(mockGrades);

      const result = await controller.findAll(mockAuthUser, '1');

      expect(result.grades).toHaveLength(2);
      expect(result.grades[0].name).toBe('Prova 1');
      expect(result.grades[0].value).toBe(8.5);
      expect(getAllGradesFromSubjectService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        1,
      );
    });

    it('deve retornar lista vazia quando não houver notas', async () => {
      mockGetAllGradesFromSubjectService.execute.mockResolvedValue([]);

      const result = await controller.findAll(mockAuthUser, '1');

      expect(result.grades).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('deve criar uma nota e retornar a resposta formatada', async () => {
      const createGradeDto: CreateGradeDto = {
        userSubjectId: 1,
        name: 'Prova 1',
        percentage: 30,
        value: 8.5,
      };

      const mockGrade = {
        id: 1,
        name: createGradeDto.name,
        value: createGradeDto.value,
        userSubjectId: createGradeDto.userSubjectId,
        createdAt: new Date(),
      } as Grade;

      mockCreateGradeService.execute.mockResolvedValue(mockGrade);

      const result = await controller.create(mockAuthUser, createGradeDto);

      expect(result.id).toBe(mockGrade.id);
      expect(result.name).toBe(mockGrade.name);
      expect(result.value).toBe(mockGrade.value);
      expect(result.userSubjectId).toBe(mockGrade.userSubjectId);
      expect(createGradeService.execute).toHaveBeenCalledWith(
        mockAuthUser,
        createGradeDto,
      );
    });
  });

  describe('delete', () => {
    it('deve deletar uma nota com sucesso', async () => {
      mockDeleteGradeService.execute.mockResolvedValue(undefined);

      await controller.delete(mockAuthUser, '1');

      expect(deleteGradeService.execute).toHaveBeenCalledWith(mockAuthUser, 1);
    });
  });
});
