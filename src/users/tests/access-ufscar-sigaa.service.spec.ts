import { Test, TestingModule } from '@nestjs/testing';
import { AccessUFSCarSigaaService } from '../services/access-ufscar-sigaa.service';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';

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
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });

    it('deve ter todas as dependências injetadas', () => {
      expect(userRepository).toBeDefined();
      expect(courseRepository).toBeDefined();
      expect(instituteRepository).toBeDefined();
      expect(subjectRepository).toBeDefined();
      expect(subjectClassRepository).toBeDefined();
      expect(userSubjectRepository).toBeDefined();
    });

    it('deve lançar erro quando credenciais são inválidas', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(service.execute('123456', 'senha')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('deve processar resposta do SIGAA com sucesso', async () => {
      const mockResponse = {
        usuarioLogado: {
          nome: 'Test User',
          email: 'test@ufscar.br',
        },
        curso: 'Ciência da Computação',
        instituto: 'DC - Departamento de Computação',
        turmas: [
          {
            codigoTurma: 'T1',
            codigoDisciplina: 'CC001',
            nomeDisciplina: 'Algoritmos',
            horarios: [
              {
                diaSemana: 'SEG',
                horaInicio: '08:00',
                horaFim: '10:00',
              },
            ],
            observacoes: 'Turma A',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      mockInstituteRepository.findOrCreate.mockResolvedValue({
        id: 1,
        name: 'DC - Departamento de Computação',
      });
      mockCourseRepository.findOrCreate.mockResolvedValue({
        id: 1,
        name: 'Ciência da Computação',
      });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([
        {
          id: 1,
          code: 'CC001',
          name: 'Algoritmos',
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
        email: 'test@ufscar.br',
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
      expect(result.email).toBe('test@ufscar.br');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@ufscar.br');
      expect(instituteRepository.findOrCreate).toHaveBeenCalled();
      expect(courseRepository.findOrCreate).toHaveBeenCalled();
    });

    it('deve criar novas matérias quando não existem', async () => {
      const mockResponse = {
        usuarioLogado: {
          nome: 'Test User',
          email: 'test@ufscar.br',
        },
        curso: 'Ciência da Computação',
        instituto: 'DC - Departamento de Computação',
        turmas: [
          {
            codigoTurma: 'T1',
            codigoDisciplina: 'CC002',
            nomeDisciplina: 'Estruturas de Dados',
            horarios: [
              {
                diaSemana: 'TER',
                horaInicio: '14:00',
                horaFim: '16:00',
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      mockInstituteRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockCourseRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([]);
      mockSubjectRepository.create.mockResolvedValue({
        id: 2,
        code: 'CC002',
        name: 'Estruturas de Dados',
      });
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue(
        null,
      );
      mockSubjectClassRepository.create.mockResolvedValue({ id: 2 });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        email: 'test@ufscar.br',
        securePin: 'pin',
      });
      mockUserSubjectRepository.findManyByUserId.mockResolvedValue([]);
      mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue(
        null,
      );

      await service.execute('123456', 'senha');

      expect(subjectRepository.create).toHaveBeenCalledWith(
        'CC002',
        'Estruturas de Dados',
        2,
      );
    });

    it('deve atualizar observations quando mudarem', async () => {
      const mockResponse = {
        usuarioLogado: {
          nome: 'Test User',
          email: 'test@ufscar.br',
        },
        curso: 'Ciência da Computação',
        instituto: 'DC',
        turmas: [
          {
            codigoDisciplina: 'CC001',
            nomeDisciplina: 'Algoritmos',
            horarios: [
              { diaSemana: 'SEG', horaInicio: '08:00', horaFim: '10:00' },
            ],
            observacoes: 'Observação nova',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      mockInstituteRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockCourseRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([
        { id: 1, code: 'CC001' },
      ]);
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue({
        id: 1,
        observations: 'Observação antiga',
      });
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@ufscar.br',
        name: 'Test User',
        securePin: 'pin',
      });
      mockUserSubjectRepository.findManyByUserId.mockResolvedValue([]);
      mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue(
        null,
      );

      await service.execute('123456', 'senha');

      expect(subjectClassRepository.updateObservations).toHaveBeenCalledWith(
        1,
        'Observação nova',
      );
    });

    it('deve atualizar nome do usuário quando mudar', async () => {
      const mockResponse = {
        usuarioLogado: {
          nome: 'New Name',
          email: 'test@ufscar.br',
        },
        curso: 'Ciência da Computação',
        instituto: 'DC',
        turmas: [
          {
            codigoDisciplina: 'CC001',
            nomeDisciplina: 'Algoritmos',
            horarios: [
              { diaSemana: 'SEG', horaInicio: '08:00', horaFim: '10:00' },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      mockInstituteRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockCourseRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([
        { id: 1, code: 'CC001' },
      ]);
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue({
        id: 1,
      });
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@ufscar.br',
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

    it('deve remover matérias que o usuário não está mais cursando', async () => {
      const mockResponse = {
        usuarioLogado: {
          nome: 'Test User',
          email: 'test@ufscar.br',
        },
        curso: 'Ciência da Computação',
        instituto: 'DC',
        turmas: [
          {
            codigoDisciplina: 'CC001',
            nomeDisciplina: 'Algoritmos',
            horarios: [
              { diaSemana: 'SEG', horaInicio: '08:00', horaFim: '10:00' },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      mockInstituteRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockCourseRepository.findOrCreate.mockResolvedValue({ id: 1 });
      mockSubjectRepository.findManyByCodes.mockResolvedValue([
        { id: 1, code: 'CC001' },
      ]);
      mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue({
        id: 1,
      });
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@ufscar.br',
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
