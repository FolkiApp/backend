import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UniversityRepository } from '../repositories/university.repository';

describe('UniversityRepository', () => {
  let repository: UniversityRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    university: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
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

  describe('findBySlug', () => {
    it('deve retornar universidade quando slug existe', async () => {
      const mockUniversity = {
        id: 1,
        name: 'Universidade A',
        slug: 'universidade-a',
      };

      mockPrismaService.university.findUnique.mockResolvedValue(mockUniversity);

      const result = await repository.findBySlug('universidade-a');

      expect(result).toEqual(mockUniversity);
      expect(prismaService.university.findUnique).toHaveBeenCalledWith({
        where: { slug: 'universidade-a' },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    });

    it('deve retornar null quando slug não existe', async () => {
      mockPrismaService.university.findUnique.mockResolvedValue(null);

      const result = await repository.findBySlug('inexistente');

      expect(result).toBeNull();
      expect(prismaService.university.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('deve criar uma nova universidade', async () => {
      const createData = {
        name: 'Nova Universidade',
        slug: 'nova-universidade',
        logo: 'https://logo.com/nova.png',
      };

      const createdUniversity = {
        id: 1,
        name: createData.name,
        slug: createData.slug,
      };

      mockPrismaService.university.create.mockResolvedValue(createdUniversity);

      const result = await repository.create(createData);

      expect(result).toEqual(createdUniversity);
      expect(prismaService.university.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          slug: createData.slug,
          logo: createData.logo,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    });
  });
});
