import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { InstituteRepository } from '../repositories/institute.repository';

describe('InstituteRepository', () => {
  let repository: InstituteRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    institute: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstituteRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<InstituteRepository>(InstituteRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByNameAndUniversity', () => {
    it('deve retornar um instituto pelo nome e universidade', async () => {
      const mockInstitute = {
        id: 1,
        name: 'Instituto de Matemática e Estatística',
        universityId: 1,
      };

      mockPrismaService.institute.findFirst.mockResolvedValue(mockInstitute);

      const result = await repository.findByNameAndUniversity(
        'Instituto de Matemática e Estatística',
        1,
      );

      expect(result).toEqual(mockInstitute);
      expect(prismaService.institute.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'Instituto de Matemática e Estatística',
          universityId: 1,
        },
      });
    });

    it('deve retornar null quando instituto não existe', async () => {
      mockPrismaService.institute.findFirst.mockResolvedValue(null);

      const result = await repository.findByNameAndUniversity(
        'Instituto Inexistente',
        1,
      );

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar um novo instituto', async () => {
      const mockCreatedInstitute = {
        id: 1,
        name: 'Instituto de Ciências Matemáticas e Computação',
        universityId: 1,
      };

      mockPrismaService.institute.create.mockResolvedValue(
        mockCreatedInstitute,
      );

      const result = await repository.create(
        'Instituto de Ciências Matemáticas e Computação',
        1,
      );

      expect(result).toEqual(mockCreatedInstitute);
      expect(prismaService.institute.create).toHaveBeenCalledWith({
        data: {
          name: 'Instituto de Ciências Matemáticas e Computação',
          universityId: 1,
        },
      });
    });
  });

  describe('findOrCreate', () => {
    it('deve retornar instituto existente', async () => {
      const mockInstitute = {
        id: 1,
        name: 'Instituto de Matemática e Estatística',
        universityId: 1,
      };

      mockPrismaService.institute.findFirst.mockResolvedValue(mockInstitute);

      const result = await repository.findOrCreate(
        'Instituto de Matemática e Estatística',
        1,
      );

      expect(result).toEqual(mockInstitute);
      expect(prismaService.institute.findFirst).toHaveBeenCalled();
      expect(prismaService.institute.create).not.toHaveBeenCalled();
    });

    it('deve criar um novo instituto quando não existe', async () => {
      const mockNewInstitute = {
        id: 2,
        name: 'Escola Politécnica',
        universityId: 1,
      };

      mockPrismaService.institute.findFirst.mockResolvedValue(null);
      mockPrismaService.institute.create.mockResolvedValue(mockNewInstitute);

      const result = await repository.findOrCreate('Escola Politécnica', 1);

      expect(result).toEqual(mockNewInstitute);
      expect(prismaService.institute.findFirst).toHaveBeenCalled();
      expect(prismaService.institute.create).toHaveBeenCalled();
    });
  });
});
