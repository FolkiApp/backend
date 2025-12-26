import { Test, TestingModule } from '@nestjs/testing';
import { FindAllImportantDateService } from '../services/find-all-important-date.service';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { InvalidUniversityException } from '../../common/exceptions/invalid-university.exception';
import { AuthUser } from '../../common/guards/auth.guard';

describe('FindAllImportantDateService', () => {
  let service: FindAllImportantDateService;
  let instituteRepository: InstituteRepository;
  let importantDatesRepository: ImportantDateRepository;

  const mockInstituteRepository = {
    findById: jest.fn(),
  };

  const mockImportantDateRepository = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllImportantDateService,
        { provide: InstituteRepository, useValue: mockInstituteRepository },
        {
          provide: ImportantDateRepository,
          useValue: mockImportantDateRepository,
        },
      ],
    }).compile();

    service = module.get<FindAllImportantDateService>(
      FindAllImportantDateService,
    );
    instituteRepository = module.get<InstituteRepository>(InstituteRepository);
    importantDatesRepository = module.get<ImportantDateRepository>(
      ImportantDateRepository,
    );
  });

  const startOfYearMatcher = expect.any(Date);

  describe('execute', () => {
    it('retorna datas importantes sem instituteId', async () => {
      const user: AuthUser = { universityId: 1 } as AuthUser;

      const mockDates = [
        {
          id: 1,
          name: 'Início das aulas',
          date: new Date('2025-02-01'),
          type: 'ACADEMIC',
          shouldNotify: true,
          campusId: null,
          universityId: 1,
        },
      ];

      mockImportantDateRepository.findAll.mockResolvedValue(mockDates);

      const result = await service.execute(user);

      expect(result).toEqual(mockDates);
      expect(importantDatesRepository.findAll).toHaveBeenCalledWith(
        startOfYearMatcher,
        user.universityId,
        null,
      );
    });

    it('retorna datas importantes com instituteId', async () => {
      const user: AuthUser = { universityId: 1, instituteId: 10 } as AuthUser;

      mockInstituteRepository.findById.mockResolvedValue({
        id: 10,
        campusId: 5,
      });

      const mockDates = [
        {
          id: 2,
          name: 'Semana de provas',
          date: new Date('2025-06-10'),
          type: 'EXAM',
          shouldNotify: false,
          campusId: 5,
          universityId: 1,
        },
      ];

      mockImportantDateRepository.findAll.mockResolvedValue(mockDates);

      const result = await service.execute(user);

      expect(instituteRepository.findById).toHaveBeenCalledWith(10);
      expect(importantDatesRepository.findAll).toHaveBeenCalledWith(
        startOfYearMatcher,
        1,
        5,
      );
      expect(result).toEqual(mockDates);
    });

    it('lança InvalidUniversityException quando universityId não for informado', async () => {
      const user: AuthUser = {} as AuthUser;

      await expect(service.execute(user)).rejects.toThrow(
        InvalidUniversityException,
      );

      expect(importantDatesRepository.findAll).not.toHaveBeenCalled();
      expect(instituteRepository.findById).not.toHaveBeenCalled();
    });

    it('retorna array vazio quando não houver datas importantes', async () => {
      const user: AuthUser = { universityId: 1 } as AuthUser;

      mockImportantDateRepository.findAll.mockResolvedValue([]);

      const result = await service.execute(user);

      expect(result).toEqual([]);
      expect(importantDatesRepository.findAll).toHaveBeenCalledWith(
        startOfYearMatcher,
        user.universityId,
        null,
      );
    });
  });
});
