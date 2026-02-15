import { Test, TestingModule } from '@nestjs/testing';
import { CreateGradeService } from '../services/create-grade.service';
import { GradesRepository } from '../repositories/grades.repository';
import { UserSubjectsRepository } from '../../subjects/repositories/user-subjects.repository';
import { CreateGradeDto } from '../dto/create-grade.dto';
import { UserSubjectNotFoundException } from '../exceptions/user-subject-not-found.exception';
import { GradeCreateException } from '../exceptions/grade-create.exception';
import { Grade } from '../entities/grade.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('CreateGradeService', () => {
  let service: CreateGradeService;
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

  const mockCreateGradeDto: CreateGradeDto = {
    userSubjectId: 1,
    name: 'Prova 1',
    percentage: 30,
    value: 8.5,
  };

  const mockGradesRepository = {
    create: jest.fn(),
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
        CreateGradeService,
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

    service = module.get<CreateGradeService>(CreateGradeService);
    gradesRepository = module.get<GradesRepository>(GradesRepository);
    userSubjectsRepository = module.get<UserSubjectsRepository>(
      UserSubjectsRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve criar uma nota com sucesso', async () => {
      const mockUserSubject = { id: 1 };
      const mockGrade = {
        id: 1,
        name: mockCreateGradeDto.name,
        value: mockCreateGradeDto.value,
        userSubjectId: mockCreateGradeDto.userSubjectId,
        createdAt: new Date(),
      } as Grade;

      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue(
        mockUserSubject,
      );
      mockGradesRepository.create.mockResolvedValue(mockGrade);

      const result = await service.execute(mockAuthUser, mockCreateGradeDto);

      expect(result).toEqual(mockGrade);
      expect(userSubjectsRepository.findByIdAndUserId).toHaveBeenCalledWith(
        mockCreateGradeDto.userSubjectId,
        mockAuthUser.id,
      );
      expect(gradesRepository.create).toHaveBeenCalledWith({
        userSubjectId: mockCreateGradeDto.userSubjectId,
        name: mockCreateGradeDto.name,
        percentage: mockCreateGradeDto.percentage,
        value: mockCreateGradeDto.value,
      });
    });

    it('deve lançar UserSubjectNotFoundException se matéria não existir', async () => {
      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.execute(mockAuthUser, mockCreateGradeDto),
      ).rejects.toThrow(UserSubjectNotFoundException);

      expect(gradesRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar GradeCreateException em caso de erro ao verificar matéria', async () => {
      mockUserSubjectsRepository.findByIdAndUserId.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.execute(mockAuthUser, mockCreateGradeDto),
      ).rejects.toThrow(GradeCreateException);

      expect(gradesRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar GradeCreateException em caso de erro ao criar nota', async () => {
      const mockUserSubject = { id: 1 };

      mockUserSubjectsRepository.findByIdAndUserId.mockResolvedValue(
        mockUserSubject,
      );
      mockGradesRepository.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.execute(mockAuthUser, mockCreateGradeDto),
      ).rejects.toThrow(GradeCreateException);
    });
  });
});
