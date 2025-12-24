import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UniversityRepository } from '../repositories/university.repository';

describe('UniversityRepository', () => {
  let repository: UniversityRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    university: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniversityRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UniversityRepository>(UniversityRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar todas as universidades ordenadas por nome', async () => {
      const mockUniversities = [
        { id: 1, name: 'Universidade A', slug: 'universidade-a' },
        { id: 2, name: 'Universidade B', slug: 'universidade-b' },
      ];

      mockPrismaService.university.findMany.mockResolvedValue(mockUniversities);

      const result = await repository.findAll();

      expect(result).toEqual(mockUniversities);
      expect(prismaService.university.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      expect(prismaService.university.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve retornar array vazio quando não houver universidades', async () => {
      mockPrismaService.university.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(prismaService.university.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
