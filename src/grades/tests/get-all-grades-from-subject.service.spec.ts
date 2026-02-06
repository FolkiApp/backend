import { Test, TestingModule } from '@nestjs/testing';
import { GetAllGradesFromSubjectService } from '../services/get-all-grades-from-subject.service';
import { GradesRepository } from '../repositories/grades.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { UserSubjectNotFoundException } from '../exceptions/user-subject-not-found.exception';
import { GradesFetchException } from '../exceptions/grades-fetch.exception';
import { Grade } from '../entities/grade.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('GetAllGradesFromSubjectService', () => {
  let service: GetAllGradesFromSubjectService;
  let gradesRepository: GradesRepository;
  let userSubjectsRepository: UserSubjectsRepository;

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

  const mockGradesRepository = {
    findAllByUserSubject: jest.fn(),
  };

  const mockUserSubjectsRepository = {
    findByIdAndUserId: jest.fn(),
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
        GetAllGradesFromSubjectService,
        {
          provide: GradesRepository,
          useValue: mockGradesRepository,
        },
        {
          provide: UserSubjectsRepository,
          useValue: mockUserSubjectsRepository,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<GetAllGradesFromSubjectService>(
      GetAllGradesFromSubjectService,
    );
    gradesRepository = module.get<GradesRepository>(GradesRepository);
    userSubjectsRepository = module.get<UserSubjectsRepository>(
      UserSubjectsRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar lista de notas com sucesso', async () => {
      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue({ id: 1 });
      mockGradesRepository.findAllByUserSubject.mockResolvedValue(mockGrades);

      const result = await service.execute(mockAuthUser, 1);

      expect(result).toEqual(mockGrades);
      expect(result).toHaveLength(2);
      expect(userSubjectsRepository.findByIdAndUserId).toHaveBeenCalledWith(
        1,
        1,
      );
      expect(gradesRepository.findAllByUserSubject).toHaveBeenCalledWith(1);
    });

    it('deve retornar lista vazia quando não houver notas', async () => {
      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue({ id: 1 });
      mockGradesRepository.findAllByUserSubject.mockResolvedValue([]);

      const result = await service.execute(mockAuthUser, 1);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('deve lançar UserSubjectNotFoundException se matéria não existir', async () => {
      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        UserSubjectNotFoundException,
      );

      expect(gradesRepository.findAllByUserSubject).not.toHaveBeenCalled();
    });

    it('deve lançar GradesFetchException em caso de erro ao verificar matéria', async () => {
      mockUserSubjectsRepository.findByIdAndUserId.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        GradesFetchException,
      );
    });

    it('deve lançar GradesFetchException em caso de erro ao buscar notas', async () => {
      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue({ id: 1 });
      mockGradesRepository.findAllByUserSubject.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        GradesFetchException,
      );
    });
  });
});
