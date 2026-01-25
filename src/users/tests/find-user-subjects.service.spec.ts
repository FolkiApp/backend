import { Test, TestingModule } from '@nestjs/testing';
import { FindUserSubjectsService } from '../services/find-user-subjects.service';
import { UserSubjectRepository } from '../repositories/user-subject.repository';
import { UserSubject } from '../entities/user-subject.entity';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';

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

      const latestClass = {
        year: 2024,
        semester: 2,
      };

      const userSubjects: UserSubject[] = [
        {
          id: 1,
          userId,
          subjectClassId: 10,
          absences: 2,
          grading: 8.5,
          createdAt: new Date(),
        } as UserSubject,
      ];

      mockSubjectClassRepository.findLatest.mockResolvedValue(latestClass);
      mockUserSubjectRepository.findByUserAndClass.mockResolvedValue(
        userSubjects,
      );

      const result = await service.execute(userId);

      expect(result).toEqual(userSubjects);
      expect(subjectClassRepository.findLatest).toHaveBeenCalledTimes(1);
      expect(userSubjectRepository.findByUserAndClass).toHaveBeenCalledWith(
        userId,
        latestClass.year,
        latestClass.semester,
      );
    });

    it('deve retornar array vazio quando não existir turma mais recente', async () => {
      const userId = 1;

      mockSubjectClassRepository.findLatest.mockResolvedValue(null);

      const result = await service.execute(userId);

      expect(result).toEqual([]);
      expect(subjectClassRepository.findLatest).toHaveBeenCalledTimes(1);
      expect(userSubjectRepository.findByUserAndClass).not.toHaveBeenCalled();
    });
  });
});
