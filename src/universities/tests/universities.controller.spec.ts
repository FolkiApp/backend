import { Test, TestingModule } from '@nestjs/testing';
import { UniversitiesController } from '../universities.controller';
import { FindAllUniversitiesService } from '../services/find-all-universities.service';

describe('UniversitiesController', () => {
  let controller: UniversitiesController;
  let service: FindAllUniversitiesService;

  const mockFindAllUniversitiesService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UniversitiesController],
      providers: [
        {
          provide: FindAllUniversitiesService,
          useValue: mockFindAllUniversitiesService,
        },
      ],
    }).compile();

    controller = module.get<UniversitiesController>(UniversitiesController);
    service = module.get<FindAllUniversitiesService>(
      FindAllUniversitiesService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar array de universidades', async () => {
      const mockUniversities = [
        { id: 1, name: 'USP', slug: 'usp' },
        { id: 2, name: 'UNICAMP', slug: 'unicamp' },
      ];

      mockFindAllUniversitiesService.execute.mockResolvedValue(
        mockUniversities,
      );

      const result = await controller.findAll();

      expect(result).toEqual(mockUniversities);
      expect(service.execute).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando não houver universidades', async () => {
      mockFindAllUniversitiesService.execute.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.execute).toHaveBeenCalledTimes(1);
    });
  });
});
