import { Test, TestingModule } from '@nestjs/testing';
import { DeleteGradeService } from '../services/delete-grade.service';
import { GradesRepository } from '../repositories/grades.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { GradeNotFoundException } from '../exceptions/grade-not-found.exception';
import { PermissionDeniedToDeleteGradeException } from '../exceptions/permission-denied-to-delete-grade.exception';
import { GradeDeleteException } from '../exceptions/grade-delete.exception';
import { Grade } from '../entities/grade.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('DeleteGradeService', () => {
  let service: DeleteGradeService;
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

  const mockGrade = {
    id: 1,
    name: 'Prova 1',
    value: 8.5,
    percentage: 30,
    userSubjectId: 1,
    createdAt: new Date(),
  } as Grade;

  const mockGradesRepository = {
    findById: jest.fn(),
    delete: jest.fn(),
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
        DeleteGradeService,
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

    service = module.get<DeleteGradeService>(DeleteGradeService);
    gradesRepository = module.get<GradesRepository>(GradesRepository);
    userSubjectsRepository = module.get<UserSubjectsRepository>(
      UserSubjectsRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve deletar uma nota quando usuário é o dono da matéria', async () => {
      const mockUserSubject = { id: 1 };

      mockGradesRepository.findById.mockResolvedValue(mockGrade);
      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue(
        mockUserSubject,
      );
      mockGradesRepository.delete.mockResolvedValue(undefined);

      await service.execute(mockAuthUser, 1);

      expect(gradesRepository.findById).toHaveBeenCalledWith(1);
      expect(userSubjectsRepository.findByIdAndUserId).toHaveBeenCalledWith(
        mockGrade.userSubjectId,
        mockAuthUser.id,
      );
      expect(gradesRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar GradeNotFoundException se nota não existir', async () => {
      mockGradesRepository.findById.mockResolvedValue(null);

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        GradeNotFoundException,
      );

      expect(gradesRepository.delete).not.toHaveBeenCalled();
    });

    it('deve lançar GradeDeleteException em caso de erro ao buscar nota', async () => {
      mockGradesRepository.findById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        GradeDeleteException,
      );

      expect(gradesRepository.delete).not.toHaveBeenCalled();
    });

    it('deve lançar PermissionDeniedToDeleteGradeException se matéria não pertencer ao usuário', async () => {
      mockGradesRepository.findById.mockResolvedValue(mockGrade);
      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        PermissionDeniedToDeleteGradeException,
      );

      expect(gradesRepository.delete).not.toHaveBeenCalled();
    });

    it('deve lançar GradeDeleteException em caso de erro ao verificar propriedade da matéria', async () => {
      mockGradesRepository.findById.mockResolvedValue(mockGrade);
      mockUserSubjectsRepository.findByIdAndUserId.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        GradeDeleteException,
      );

      expect(gradesRepository.delete).not.toHaveBeenCalled();
    });

    it('deve lançar GradeDeleteException em caso de erro ao deletar nota', async () => {
      const mockUserSubject = { id: 1 };

      mockGradesRepository.findById.mockResolvedValue(mockGrade);
      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue(
        mockUserSubject,
      );
      mockGradesRepository.delete.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 1)).rejects.toThrow(
        GradeDeleteException,
      );
    });
  });
});
