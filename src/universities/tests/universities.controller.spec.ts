import { Test, TestingModule } from '@nestjs/testing';
import { UniversitiesController } from '../universities.controller';
import { FindAllUniversitiesService } from '../services/find-all-universities.service';
import { CreateUniversityService } from '../services/create-university.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('UniversitiesController', () => {
  let controller: UniversitiesController;
  let findAllService: FindAllUniversitiesService;
  let createService: CreateUniversityService;

  const mockFindAllUniversitiesService = {
    execute: jest.fn(),
  };

  const mockCreateUniversityService = {
    execute: jest.fn(),
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
      controllers: [UniversitiesController],
      providers: [
        {
          provide: FindAllUniversitiesService,
          useValue: mockFindAllUniversitiesService,
        },
        {
          provide: CreateUniversityService,
          useValue: mockCreateUniversityService,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    controller = module.get<UniversitiesController>(UniversitiesController);
    findAllService = module.get<FindAllUniversitiesService>(
      FindAllUniversitiesService,
    );
    createService = module.get<CreateUniversityService>(
      CreateUniversityService,
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
      expect(findAllService.execute).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando não houver universidades', async () => {
      mockFindAllUniversitiesService.execute.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(findAllService.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('deve criar uma nova universidade', async () => {
      const createDto = {
        name: 'USP',
        slug: 'usp',
        logo: 'https://logo.com/usp.png',
      };

      const createdUniversity = {
        id: 1,
        name: createDto.name,
        slug: createDto.slug,
      };

      mockCreateUniversityService.execute.mockResolvedValue(createdUniversity);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        id: createdUniversity.id,
        name: createdUniversity.name,
        slug: createdUniversity.slug,
      });
      expect(createService.execute).toHaveBeenCalledWith(createDto);
      expect(createService.execute).toHaveBeenCalledTimes(1);
    });
  });
});
