import { Test, TestingModule } from '@nestjs/testing';
import { AbsenceBySubjectService } from '../services/find-absence-by-subject.service';
import { AbsenceRepository } from '../repositories/absence.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { UserAbsence } from '../entities/absence.entity';
import { InvalidSubjectIdException } from '../../subjects/exceptions/subject-fetch-id.exception';
import { AbsenceBySubjectException } from '../exceptions/absence-by-subject.exception';

describe('AbsenceBySubjectService', () => {
  let service: AbsenceBySubjectService;
  let absenceRepository: AbsenceRepository;
  let subjectRepository: SubjectRepository;

  const mockAuthUser = {
    id: 3,
    email: 'user@example.com',
    name: 'Test User',
    isAdmin: false,
    instituteId: 1,
    courseId: 2,
    universityId: 1,
    isBlocked: false,
    userVersion: '1.0',
  };

  const mockAbsenceRepository = {
    findBySubject: jest.fn(),
  };

  const mockSubjectRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbsenceBySubjectService,
        {
          provide: AbsenceRepository,
          useValue: mockAbsenceRepository,
        },
        {
          provide: SubjectRepository,
          useValue: mockSubjectRepository,
        },
      ],
    }).compile();

    service = module.get<AbsenceBySubjectService>(AbsenceBySubjectService);
    absenceRepository = module.get<AbsenceRepository>(AbsenceRepository);
    subjectRepository = module.get<SubjectRepository>(SubjectRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar faltas de um usuário em uma disciplina', async () => {
      const mockSubject = {
        id: 7,
        code: 'MAC0110',
        name: 'Introdução à Computação',
        universityId: 1,
      };

      const mockAbsences = [
        new UserAbsence(
          1,
          new Date('2025-03-10'),
          new Date('2025-03-10T12:30:00'),
          3,
          7,
        ),
        new UserAbsence(
          2,
          new Date('2025-03-15'),
          new Date('2025-03-15T10:00:00'),
          3,
          7,
        ),
      ];

      mockSubjectRepository.findById.mockResolvedValue(mockSubject);
      mockAbsenceRepository.findBySubject.mockResolvedValue(mockAbsences);

      const result = await service.execute(mockAuthUser, 7);

      expect(result).toEqual(mockAbsences);
      expect(subjectRepository.findById).toHaveBeenCalledWith(7);
      expect(absenceRepository.findBySubject).toHaveBeenCalledWith(3, 7);
    });

    it('deve lançar InvalidSubjectIdException quando a disciplina não existe', async () => {
      mockSubjectRepository.findById.mockResolvedValue(null);

      await expect(service.execute(mockAuthUser, 999)).rejects.toThrow(
        InvalidSubjectIdException,
      );

      expect(subjectRepository.findById).toHaveBeenCalledWith(999);
    });

    it('deve lançar AbsenceBySubjectException em caso de erro ao buscar faltas', async () => {
      const mockSubject = {
        id: 7,
        code: 'MAC0110',
        name: 'Introdução à Computação',
        universityId: 1,
      };

      mockSubjectRepository.findById.mockResolvedValue(mockSubject);
      mockAbsenceRepository.findBySubject.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 7)).rejects.toThrow(
        AbsenceBySubjectException,
      );
    });

    it('deve lançar AbsenceBySubjectException em caso de erro ao buscar a disciplina', async () => {
      mockSubjectRepository.findById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockAuthUser, 7)).rejects.toThrow(
        AbsenceBySubjectException,
      );
    });
  });
});
