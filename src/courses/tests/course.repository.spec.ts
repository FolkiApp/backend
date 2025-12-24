import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CourseRepository } from '../repositories/course.repository';

describe('CourseRepository', () => {
  let repository: CourseRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    course: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<CourseRepository>(CourseRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByNameAndUniversity', () => {
    it('deve retornar um curso pelo nome e universidade', async () => {
      const mockCourse = {
        id: 1,
        name: 'Engenharia de Computação',
        universityId: 1,
      };

      mockPrismaService.course.findFirst.mockResolvedValue(mockCourse);

      const result = await repository.findByNameAndUniversity(
        'Engenharia de Computação',
        1,
      );

      expect(result).toEqual(mockCourse);
      expect(prismaService.course.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'Engenharia de Computação',
          universityId: 1,
        },
      });
    });

    it('deve retornar null quando curso não existe', async () => {
      mockPrismaService.course.findFirst.mockResolvedValue(null);

      const result = await repository.findByNameAndUniversity(
        'Curso Inexistente',
        1,
      );

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar um novo curso', async () => {
      const mockCreatedCourse = {
        id: 1,
        name: 'Ciência da Computação',
        universityId: 1,
      };

      mockPrismaService.course.create.mockResolvedValue(mockCreatedCourse);

      const result = await repository.create('Ciência da Computação', 1);

      expect(result).toEqual(mockCreatedCourse);
      expect(prismaService.course.create).toHaveBeenCalledWith({
        data: {
          name: 'Ciência da Computação',
          universityId: 1,
        },
      });
    });
  });

  describe('findOrCreate', () => {
    it('deve retornar curso existente', async () => {
      const mockCourse = {
        id: 1,
        name: 'Engenharia de Computação',
        universityId: 1,
      };

      mockPrismaService.course.findFirst.mockResolvedValue(mockCourse);

      const result = await repository.findOrCreate(
        'Engenharia de Computação',
        1,
      );

      expect(result).toEqual(mockCourse);
      expect(prismaService.course.findFirst).toHaveBeenCalled();
      expect(prismaService.course.create).not.toHaveBeenCalled();
    });

    it('deve criar um novo curso quando não existe', async () => {
      const mockNewCourse = {
        id: 2,
        name: 'Matemática Aplicada',
        universityId: 1,
      };

      mockPrismaService.course.findFirst.mockResolvedValue(null);
      mockPrismaService.course.create.mockResolvedValue(mockNewCourse);

      const result = await repository.findOrCreate('Matemática Aplicada', 1);

      expect(result).toEqual(mockNewCourse);
      expect(prismaService.course.findFirst).toHaveBeenCalled();
      expect(prismaService.course.create).toHaveBeenCalled();
    });
  });
});
