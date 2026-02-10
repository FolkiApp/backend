import { Test, TestingModule } from '@nestjs/testing';
import { CreateUniversityService } from '../services/create-university.service';
import { UniversityRepository } from '../repositories/university.repository';
import { UniversityAlreadyExistsException } from '../exceptions/university-already-exists.exception';
import { CreateUniversityDto } from '../dto/create-university.dto';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('CreateUniversityService', () => {
  let service: CreateUniversityService;
  let repository: UniversityRepository;

  const mockUniversityRepository = {
    findBySlug: jest.fn(),
    create: jest.fn(),
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
        CreateUniversityService,
        {
          provide: UniversityRepository,
          useValue: mockUniversityRepository,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<CreateUniversityService>(CreateUniversityService);
    repository = module.get<UniversityRepository>(UniversityRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const createDto: CreateUniversityDto = {
      name: 'Universidade de São Paulo',
      slug: 'usp',
      logo: 'https://logo.com/usp.png',
    };

    it('deve criar uma nova universidade com sucesso', async () => {
      const createdUniversity = {
        id: 1,
        name: createDto.name,
        slug: createDto.slug,
      };

      mockUniversityRepository.findBySlug.mockResolvedValue(null);
      mockUniversityRepository.create.mockResolvedValue(createdUniversity);

      const result = await service.execute(createDto);

      expect(result).toEqual(createdUniversity);
      expect(repository.findBySlug).toHaveBeenCalledWith(createDto.slug);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('deve lançar UniversityAlreadyExistsException quando slug já existe', async () => {
      const existingUniversity = {
        id: 1,
        name: 'Existing University',
        slug: createDto.slug,
      };

      mockUniversityRepository.findBySlug.mockResolvedValue(existingUniversity);

      await expect(service.execute(createDto)).rejects.toThrow(
        UniversityAlreadyExistsException,
      );
      expect(repository.findBySlug).toHaveBeenCalledWith(createDto.slug);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
