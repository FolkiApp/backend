import { Test, TestingModule } from '@nestjs/testing';
import { AccessUFSCarSigaaService } from '../services/access-ufscar-sigaa.service';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';

// Mock global fetch
global.fetch = jest.fn();

describe('AccessUFSCarSigaaService', () => {
  let service: AccessUFSCarSigaaService;
  let userRepository: UserRepository;
  let courseRepository: CourseRepository;
  let instituteRepository: InstituteRepository;
  let subjectRepository: SubjectRepository;
  let subjectClassRepository: SubjectClassRepository;
  let userSubjectRepository: UserSubjectRepository;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateName: jest.fn(),
  };

  const mockCourseRepository = {
    findOrCreate: jest.fn(),
  };

  const mockInstituteRepository = {
    findOrCreate: jest.fn(),
  };

  const mockSubjectRepository = {
    findManyByCodes: jest.fn(),
    create: jest.fn(),
  };

  const mockSubjectClassRepository = {
    findBySubjectAndSchedule: jest.fn(),
    create: jest.fn(),
    updateObservations: jest.fn(),
  };

  const mockUserSubjectRepository = {
    findByUserAndSubjectClass: jest.fn(),
    create: jest.fn(),
    findManyByUserId: jest.fn(),
    softDeleteMany: jest.fn(),
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
        AccessUFSCarSigaaService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: CourseRepository,
          useValue: mockCourseRepository,
        },
        {
          provide: InstituteRepository,
          useValue: mockInstituteRepository,
        },
        {
          provide: SubjectRepository,
          useValue: mockSubjectRepository,
        },
        {
          provide: SubjectClassRepository,
          useValue: mockSubjectClassRepository,
        },
        {
          provide: UserSubjectRepository,
          useValue: mockUserSubjectRepository,
        },
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<AccessUFSCarSigaaService>(AccessUFSCarSigaaService);
    userRepository = module.get<UserRepository>(UserRepository);
    courseRepository = module.get<CourseRepository>(CourseRepository);
    instituteRepository = module.get<InstituteRepository>(InstituteRepository);
    subjectRepository = module.get<SubjectRepository>(SubjectRepository);
    subjectClassRepository = module.get<SubjectClassRepository>(
      SubjectClassRepository,
    );
    userSubjectRepository = module.get<UserSubjectRepository>(
      UserSubjectRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all dependencies injected', () => {
      expect(userRepository).toBeDefined();
      expect(courseRepository).toBeDefined();
      expect(instituteRepository).toBeDefined();
      expect(subjectRepository).toBeDefined();
      expect(subjectClassRepository).toBeDefined();
      expect(userSubjectRepository).toBeDefined();
    });

    it('should throw error when credentials are invalid', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(service.execute('123456', 'senha')).rejects.toThrow(
        'Credenciais inválidas',
      );
    });

    it('should process SIGAA response successfully', async () => {
      const mockDeferimento = {
        data: [
          {
            atividade: 'ALGORITMOS',
            turma: 'A',
            periodo: 1,
            ano: 2026,
            horarios: [
              {
                dia: 'SEGUNDA',
                inicio: '08:00:00',
                fim: '10:00:00',
                sala: 'Lab 1',
              },
            ],
          },
        ],
      };

      const mockCarteira = {
        data: [
          {
            nome: 'Test User',
            nomeSocial: null,
            unidade: 'DC - Departamento de Computação',
          },
        ],
      };

      const mockDetails = {
        details: {
          email: 'test@estudante.ufscar.br',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDeferimento),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCarteira),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDetails),
        });

      mockInstituteRepository.findOrCreate.mockResolvedValue({
        id: 1,
        name: 'DC - Departamento de Computação',
      });
      mockCourseRepository.findOrCreate.mockResolvedValue({
        id: 1,
        name: 'Bacharelado UFSCar',
      });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([
        {
          id: 1,
          code: 'ALGORITMOS',
          name: 'ALGORITMOS',
        },
      ]);
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue(
        null,
      );
      mockSubjectClassRepository.create.mockResolvedValue({
        id: 1,
        subjectId: 1,
      });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        email: 'test@estudante.ufscar.br',
        name: 'Test User',
        instituteId: 1,
        courseId: 1,
        universityId: 2,
        securePin: 'secure-pin',
      });
      mockUserSubjectRepository.findManyByUserId.mockResolvedValue([]);
      mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue(
        null,
      );

      const result = await service.execute('123456', 'senha');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@estudante.ufscar.br');
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'test@estudante.ufscar.br',
      );
      expect(instituteRepository.findOrCreate).toHaveBeenCalled();
      expect(courseRepository.findOrCreate).toHaveBeenCalled();
    });

    it('should create new subjects when they do not exist', async () => {
      const mockDeferimento = {
        data: [
          {
            atividade: 'ESTRUTURAS DE DADOS',
            turma: 'A',
            periodo: 1,
            ano: 2026,
            horarios: [
              {
                dia: 'TERÇA',
                inicio: '14:00:00',
                fim: '16:00:00',
                sala: '',
              },
            ],
          },
        ],
      };

      const mockCarteira = {
        data: [
          {
            nome: 'Test User',
            nomeSocial: null,
            unidade: 'DC - Departamento de Computação',
          },
        ],
      };

      const mockDetails = {
        details: {
          email: 'test@estudante.ufscar.br',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDeferimento),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCarteira),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDetails),
        });

      mockInstituteRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockCourseRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([]);
      mockSubjectRepository.create.mockResolvedValue({
        id: 2,
        code: 'ESTRUTURAS DE DADOS',
        name: 'ESTRUTURAS DE DADOS',
      });
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue(
        null,
      );
      mockSubjectClassRepository.create.mockResolvedValue({ id: 2 });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        email: 'test@estudante.ufscar.br',
        securePin: 'pin',
      });
      mockUserSubjectRepository.findManyByUserId.mockResolvedValue([]);
      mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue(
        null,
      );

      await service.execute('123456', 'senha');

      expect(subjectRepository.create).toHaveBeenCalledWith(
        'ESTRUTURAS DE DADOS',
        'ESTRUTURAS DE DADOS',
        2,
      );
    });

    it('should include classRoom in availableDays', async () => {
      const mockDeferimento = {
        data: [
          {
            atividade: 'ALGORITMOS',
            turma: 'B',
            periodo: 1,
            ano: 2026,
            horarios: [
              {
                dia: 'QUARTA',
                inicio: '14:00',
                fim: '16:00',
                sala: 'AT9 - 217',
              },
              {
                dia: 'SEXTA',
                inicio: '08:00',
                fim: '10:00',
                sala: 'AT9 - 217',
              },
            ],
          },
        ],
      };

      const mockCarteira = {
        data: [
          {
            nome: 'Test User',
            nomeSocial: null,
            unidade: 'DC',
          },
        ],
      };

      const mockDetails = {
        details: {
          email: 'test@estudante.ufscar.br',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDeferimento),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCarteira),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDetails),
        });

      mockInstituteRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockCourseRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([
        { id: 1, code: 'ALGORITMOS' },
      ]);
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue(
        null,
      );
      mockSubjectClassRepository.create.mockResolvedValue({ id: 1 });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        email: 'test@estudante.ufscar.br',
        securePin: 'pin',
      });
      mockUserSubjectRepository.findManyByUserId.mockResolvedValue([]);
      mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue(
        null,
      );

      await service.execute('123456', 'senha');

      expect(subjectClassRepository.create).toHaveBeenCalledWith(
        1,
        [
          { day: 'qua', start: '14:00', end: '16:00', classRoom: 'AT9 - 217' },
          { day: 'sex', start: '08:00', end: '10:00', classRoom: 'AT9 - 217' },
        ],
        expect.any(Number),
        expect.any(Number),
        2,
        '',
      );
    });

    it('should update user name when it changes', async () => {
      const mockDeferimento = {
        data: [
          {
            atividade: 'ALGORITMOS',
            turma: 'A',
            periodo: 1,
            ano: 2026,
            horarios: [
              { dia: 'SEGUNDA', inicio: '08:00:00', fim: '10:00:00', sala: '' },
            ],
          },
        ],
      };

      const mockCarteira = {
        data: [
          {
            nome: 'New Name',
            nomeSocial: null,
            unidade: 'DC',
          },
        ],
      };

      const mockDetails = {
        details: {
          email: 'test@estudante.ufscar.br',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDeferimento),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCarteira),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDetails),
        });

      mockInstituteRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockCourseRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([
        { id: 1, code: 'ALGORITMOS' },
      ]);
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue({
        id: 1,
      });
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@estudante.ufscar.br',
        name: 'Old Name',
        securePin: 'pin',
      });
      mockUserRepository.updateName.mockResolvedValue({
        id: 1,
        name: 'New Name',
        securePin: 'pin',
      });
      mockUserSubjectRepository.findManyByUserId.mockResolvedValue([]);
      mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue(
        null,
      );

      await service.execute('123456', 'senha');

      expect(userRepository.updateName).toHaveBeenCalledWith(1, 'New Name');
    });

    it('should remove subjects that the user is no longer taking', async () => {
      const mockDeferimento = {
        data: [
          {
            atividade: 'ALGORITMOS',
            turma: 'A',
            periodo: 1,
            ano: 2026,
            horarios: [
              { dia: 'SEGUNDA', inicio: '08:00:00', fim: '10:00:00', sala: '' },
            ],
          },
        ],
      };

      const mockCarteira = {
        data: [
          {
            nome: 'Test User',
            nomeSocial: null,
            unidade: 'DC',
          },
        ],
      };

      const mockDetails = {
        details: {
          email: 'test@estudante.ufscar.br',
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDeferimento),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCarteira),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDetails),
        });

      mockInstituteRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockCourseRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([
        { id: 1, code: 'ALGORITMOS' },
      ]);
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue({
        id: 1,
      });
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@estudante.ufscar.br',
        name: 'Test User',
        securePin: 'pin',
      });
      mockUserSubjectRepository.findManyByUserId.mockResolvedValue([
        { id: 1, userId: 1, subjectClassId: 1 },
        { id: 2, userId: 1, subjectClassId: 999 },
      ]);
      mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue({
        id: 1,
      });

      await service.execute('123456', 'senha');

      expect(userSubjectRepository.softDeleteMany).toHaveBeenCalledWith(
        1,
        [999],
      );
    });
  });
});
