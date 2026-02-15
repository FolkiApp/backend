import { Test, TestingModule } from '@nestjs/testing';
import { FindAllUniversitiesService } from '../services/find-all-universities.service';
import { UniversityRepository } from '../repositories/university.repository';
import { UniversityFetchException } from '../exceptions/university-fetch.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';

interface University {
  id: number;
  name: string;
  slug: string;
}

describe('FindAllUniversitiesService', () => {
  let service: FindAllUniversitiesService;
  let repository: UniversityRepository;

  const mockUniversityRepository: Partial<UniversityRepository> = {
    findAll: jest.fn<Promise<University[]>, []>(),
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
        FindAllUniversitiesService,
        { provide: UniversityRepository, useValue: mockUniversityRepository },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<FindAllUniversitiesService>(
      FindAllUniversitiesService,
    );
    repository = module.get<UniversityRepository>(UniversityRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar lista de universidades do repositório', async () => {
      const mockUniversities: University[] = [
        { id: 1, name: 'USP', slug: 'usp' },
        { id: 2, name: 'UNICAMP', slug: 'unicamp' },
      ];

      (mockUniversityRepository.findAll as jest.Mock).mockResolvedValue(
        mockUniversities,
      );

      const result: University[] = await service.execute();

      expect(result).toEqual(mockUniversities);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando não houver universidades', async () => {
      (mockUniversityRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result: University[] = await service.execute();

      expect(result).toEqual([]);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve lançar UniversityFetchException quando ocorrer erro no repositório', async () => {
      (mockUniversityRepository.findAll as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute()).rejects.toThrow(UniversityFetchException);

      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
