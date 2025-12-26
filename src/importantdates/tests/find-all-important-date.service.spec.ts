import { Test, TestingModule } from '@nestjs/testing';
import { FindAllImportantDate } from '../services/find-all-important-date.service';
import { InstituteRepository } from 'src/institutes/repositories/institute.repository';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { InvalidUniversityException } from 'src/common/exceptions/invalid-university.exception';
import { AuthUser } from 'src/common/guards/auth.guard';
import { ImportDateType } from '@prisma/client';

describe('FindAllImportantDate', () => {
  let service: FindAllImportantDate;
  let instituteRepository: InstituteRepository;
  let importantDateRepository: ImportantDateRepository;

  const mockInstituteRepository = {
    findById: jest.fn(),
  };

  const mockImportantDateRepository = {
    findAll: jest.fn(),
  };

  const mockUser: AuthUser = {
    id: 1,
    email: 'user@test.com',
    name: 'User Test',
    instituteId: 10,
    courseId: 2,
    isAdmin: false,
    isBlocked: false,
    universityId: 20,
    userVersion: '1.0.0',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllImportantDate,
        {
          provide: InstituteRepository,
          useValue: mockInstituteRepository,
        },
        {
          provide: ImportantDateRepository,
          useValue: mockImportantDateRepository,
        },
      ],
    }).compile();

    service = module.get<FindAllImportantDate>(FindAllImportantDate);
    instituteRepository = module.get<InstituteRepository>(InstituteRepository);
    importantDateRepository = module.get<ImportantDateRepository>(
      ImportantDateRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar datas importantes quando usuário tem universidade e instituto', async () => {
      const mockInstitute = {
        id: 10,
        campusId: 5,
      };

      const mockDates = [
        {
          id: 1,
          name: 'Início do semestre',
          date: new Date('2025-02-10'),
          type: ImportDateType.DAY_OFF,
          shouldNotify: true,
          campusId: 5,
          universityId: 20,
        },
      ];

      mockInstituteRepository.findById.mockResolvedValue(mockInstitute);
      mockImportantDateRepository.findAll.mockResolvedValue(mockDates);

      const result = await service.execute(mockUser);

      expect(result).toEqual(mockDates);
      expect(instituteRepository.findById).toHaveBeenCalledWith(10);
      expect(importantDateRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve retornar datas importantes mesmo sem instituteId', async () => {
      const userWithoutInstitute: AuthUser = {
        ...mockUser,
        instituteId: null,
      };

      const mockDates = [
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

      mockImportantDateRepository.findAll.mockResolvedValue(mockDates);

      const result = await service.execute(userWithoutInstitute);

      expect(result).toEqual(mockDates);
      expect(instituteRepository.findById).not.toHaveBeenCalled();
      expect(importantDateRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve lançar InvalidUniversityException quando usuário não tem universityId', async () => {
      const invalidUser: AuthUser = {
        ...mockUser,
        universityId: null,
      };

      await expect(service.execute(invalidUser)).rejects.toThrow(
        InvalidUniversityException,
      );

      expect(instituteRepository.findById).not.toHaveBeenCalled();
      expect(importantDateRepository.findAll).not.toHaveBeenCalled();
    });

    it('deve passar campusId como null quando instituto não é encontrado', async () => {
      mockInstituteRepository.findById.mockResolvedValue(null);

      const mockDates = [
        {
          id: 3,
          name: 'Evento Geral',
          date: new Date('2025-06-01'),
          type: ImportDateType.DAY_OFF,
          shouldNotify: true,
          campusId: null,
          universityId: 20,
        },
      ];

      mockImportantDateRepository.findAll.mockResolvedValue(mockDates);

      const result = await service.execute(mockUser);

      expect(result).toEqual(mockDates);
      expect(instituteRepository.findById).toHaveBeenCalledWith(10);
      expect(importantDateRepository.findAll).toHaveBeenCalledWith(
        expect.any(Date),
        20,
        null,
      );
    });
  });
});
