import { Test, TestingModule } from '@nestjs/testing';
import { FindAllUniversitiesService } from '../services/find-all-universities.service';
import { UniversityRepository } from '../repositories/university.repository';

describe('FindAllUniversitiesService', () => {
  let service: FindAllUniversitiesService;
  let repository: UniversityRepository;

  const mockUniversityRepository = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllUniversitiesService,
        {
          provide: UniversityRepository,
          useValue: mockUniversityRepository,
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
      const mockUniversities = [
        { id: 1, name: 'USP', slug: 'usp' },
        { id: 2, name: 'UNICAMP', slug: 'unicamp' },
      ];

      mockUniversityRepository.findAll.mockResolvedValue(mockUniversities);

      const result = await service.execute();

      expect(result).toEqual(mockUniversities);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando não houver universidades', async () => {
      mockUniversityRepository.findAll.mockResolvedValue([]);

      const result = await service.execute();

      expect(result).toEqual([]);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
