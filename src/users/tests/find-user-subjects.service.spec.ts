import { Test, TestingModule } from '@nestjs/testing';
import { FindUserSubjectsService } from '../services/find-user-subjects.service';
import { UserSubjectRepository } from '../repositories/user-subject.repository';
import { UserSubject } from '../entities/user-subject.entity';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { SubjectClass } from '../../subjects/entities/subject-class.entity';

describe('FindUserSubjectsService', () => {
  let service: FindUserSubjectsService;
  let userSubjectRepository: UserSubjectRepository;
  let subjectClassRepository: SubjectClassRepository;

  const mockUserSubjectRepository = {
    findByUserAndClass: jest.fn(),
  };

  const mockSubjectClassRepository = {
    findLatest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUserSubjectsService,
        {
          provide: UserSubjectRepository,
          useValue: mockUserSubjectRepository,
        },
        {
          provide: SubjectClassRepository,
          useValue: mockSubjectClassRepository,
        },
      ],
    }).compile();

    service = module.get<FindUserSubjectsService>(FindUserSubjectsService);
    userSubjectRepository = module.get<UserSubjectRepository>(
      UserSubjectRepository,
    );
    subjectClassRepository = module.get<SubjectClassRepository>(
      SubjectClassRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar as disciplinas do usuário quando existir turma mais recente', async () => {
      const userId = 1;
      const universityId = 99;

      const latestClass = { year: 2024, semester: 2 };

      // Mock completo incluindo subjectClass
      const userSubjects: UserSubject[] = [
        {
          id: 1,
          absences: 2,
          grading: 8.5,
          subjectClass: new SubjectClass(
            10,
            [],
            { id: 1, name: 'Algoritmos' },
            undefined,
          ),
        },
      ];

      mockSubjectClassRepository.findLatest.mockResolvedValue(latestClass);
      mockUserSubjectRepository.findByUserAndClass.mockResolvedValue(
        userSubjects,
      );

      const result = await service.execute(userId, universityId);

      expect(result).toEqual(userSubjects);
      expect(subjectClassRepository.findLatest).toHaveBeenCalledWith(
        universityId,
      );
      expect(userSubjectRepository.findByUserAndClass).toHaveBeenCalledWith(
        userId,
        latestClass.year,
        latestClass.semester,
      );
    });

    it('deve retornar array vazio quando não existir turma mais recente', async () => {
      const userId = 1;
      const universityId = 99;

      mockSubjectClassRepository.findLatest.mockResolvedValue(null);

      const result = await service.execute(userId, universityId);

      expect(result).toEqual([]);
      expect(subjectClassRepository.findLatest).toHaveBeenCalledWith(
        universityId,
      );
      expect(userSubjectRepository.findByUserAndClass).not.toHaveBeenCalled();
    });
  });
});
