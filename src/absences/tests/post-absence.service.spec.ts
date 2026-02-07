import { Test, TestingModule } from '@nestjs/testing';
import { PostAbsence } from '../services/post-absence.service';
import type { AuthUser } from '../../common/guards/auth.guard';
import { AbsenceRepository } from '../repositories/absence.repository';
import { UserSubjectRepository } from '../../users/repositories/user-subject.repository';
import { UserAbsence } from '../entities/absence.entity';
import { InvalidSubjectIdException } from '../../subjects/exceptions/subject-fetch-id.exception';
import { AbsenceInternalErrorException } from '../exceptions/absence-internal-error.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('PostAbsence', () => {
  let service: PostAbsence;
  let absenceRepository: AbsenceRepository;
  let userSubjectRepository: UserSubjectRepository;

  const mockAbsenceRepository = {
    postAbsence: jest.fn(),
  };

  const mockUserSubjectRepository = {
    findByUserAndSubject: jest.fn(),
  };

  const mockCustomLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  };

  const mockAuthUser: AuthUser = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostAbsence,
        { provide: AbsenceRepository, useValue: mockAbsenceRepository },
        { provide: UserSubjectRepository, useValue: mockUserSubjectRepository },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<PostAbsence>(PostAbsence);
    absenceRepository = module.get<AbsenceRepository>(AbsenceRepository);
    userSubjectRepository = module.get<UserSubjectRepository>(
      UserSubjectRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve postar uma falta com sucesso', async () => {
      const userSubject = { id: 7 };
      const created = new UserAbsence(
        10,
        new Date('2025-04-01'),
        new Date('2025-04-01T09:00:00'),
        3,
        7,
      );

      mockUserSubjectRepository.findByUserAndSubject.mockResolvedValue(
        userSubject,
      );
      mockAbsenceRepository.postAbsence.mockResolvedValue(created);

      const result = await service.execute(
        mockAuthUser,
        7,
        new Date('2025-04-01'),
      );

      expect(result).toEqual(created);
      expect(
        userSubjectRepository.findByUserAndSubject,
      ).toHaveBeenCalledWith(3, 7);
      expect(absenceRepository.postAbsence).toHaveBeenCalledWith(
        3,
        7,
        new Date('2025-04-01'),
      );
    });

    it('deve lançar InvalidSubjectIdException quando userSubject não existe', async () => {
      mockUserSubjectRepository.findByUserAndSubject.mockResolvedValue(
        null,
      );

      await expect(
        service.execute(mockAuthUser, 999, new Date()),
      ).rejects.toThrow(InvalidSubjectIdException);
    });

    it('deve lançar AbsenceInternalErrorException quando erro ao buscar userSubject', async () => {
      mockUserSubjectRepository.findByUserAndSubject.mockRejectedValue(
        new Error('DB fail'),
      );

      await expect(
        service.execute(mockAuthUser, 7, new Date()),
      ).rejects.toThrow(AbsenceInternalErrorException);
    });

    it('deve lançar AbsenceInternalErrorException quando o repositório falha', async () => {
      const userSubject = { id: 7 };
      mockUserSubjectRepository.findByUserAndSubject.mockResolvedValue(
        userSubject,
      );
      mockAbsenceRepository.postAbsence.mockRejectedValue(new Error('DB fail'));

      await expect(
        service.execute(mockAuthUser, 7, new Date()),
      ).rejects.toThrow(AbsenceInternalErrorException);
    });
  });
});
