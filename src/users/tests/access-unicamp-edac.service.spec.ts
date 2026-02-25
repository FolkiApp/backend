import { AccessUnicampEdacService } from '../services/access-unicamp-edac.service';
import puppeteer, { Page, Browser } from 'puppeteer';
import {
  user,
  subject as SubjectPrisma,
  user_subject as UserSubject,
  institute as Institute,
  course as Course,
} from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { CourseRepository } from '../../courses/repositories/course.repository';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { SubjectRepository } from '../../subjects/repositories/subject.repository';
import { SubjectClassRepository } from '../../subjects/repositories/subject-class.repository';
import { UserSubjectRepository } from '../repositories/user-subject.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';

import { SubjectClass } from '../../subjects/entities/subject-class.entity';
import { Subject } from '../../subjects/entities/subject.entity';

jest.mock('puppeteer');

describe('AccessUnicampEdacService', () => {
  let service: AccessUnicampEdacService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateName: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;

  const mockCourseRepository = {
    findOrCreate: jest.fn(),
  } as unknown as jest.Mocked<CourseRepository>;

  const mockInstituteRepository = {
    findOrCreate: jest.fn(),
  } as unknown as jest.Mocked<InstituteRepository>;

  const mockSubjectRepository = {
    findByCode: jest.fn(),
    create: jest.fn(),
  } as unknown as jest.Mocked<SubjectRepository>;

  const mockSubjectClassRepository = {
    findBySubjectAndSchedule: jest.fn(),
    create: jest.fn(),
    updateObservations: jest.fn(),
  } as unknown as jest.Mocked<SubjectClassRepository>;

  const mockUserSubjectRepository = {
    findByUserAndSubjectClass: jest.fn(),
    findManyByUserId: jest.fn(),
    create: jest.fn(),
    softDeleteMany: jest.fn(),
    restore: jest.fn(),
  } as unknown as jest.Mocked<UserSubjectRepository>;

  const mockLogger = {
    setContext: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  } as unknown as jest.Mocked<CustomLogger>;

  const mockClose = jest.fn();
  const mockGoto = jest.fn();
  const mockType = jest.fn();
  const mockClick = jest.fn();
  const mockWaitForNavigation = jest.fn();
  const mockOn = jest.fn();
  const mockEvaluate = jest.fn();
  const mockWaitForFunction = jest.fn().mockResolvedValue(true);
  const mockWaitForSelector = jest.fn().mockResolvedValue(null);
  const mockRemoveAllListeners = jest.fn();

  const mockPage: Partial<Page> = {
    goto: mockGoto,
    type: mockType,
    click: mockClick,
    waitForNavigation: mockWaitForNavigation,
    on: mockOn,
    evaluate: mockEvaluate,
    waitForFunction: mockWaitForFunction,
    waitForSelector: mockWaitForSelector,
    removeAllListeners: mockRemoveAllListeners,
  };

  const mockBrowser: Partial<Browser> = {
    newPage: jest.fn().mockResolvedValue(mockPage as Page),
    close: mockClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as Browser);

    service = new AccessUnicampEdacService(
      mockUserRepository,
      mockCourseRepository,
      mockInstituteRepository,
      mockSubjectRepository,
      mockSubjectClassRepository,
      mockUserSubjectRepository,
      mockLogger,
    );
  });

  function mockResponses(socialName: string | null = null) {
    mockOn.mockImplementation(
      (event: string, callback: (response: any) => void) => {
        if (event === 'response') {
          callback({
            url: () => 'dados-basicos',

            json: () =>
              Promise.resolve({
                retorno: { DadosBasicos: { Nome: 'João da Silva' } },
              }),
          });
          callback({
            url: () => 'grade-horaria',

            json: () =>
              Promise.resolve({
                retorno: [
                  {
                    codigoDisciplina: 'MC102',
                    nomeDisciplina: 'Algoritmos',
                    horarios: [{ dia: 2, hora: 1, sala: 'PB01' }],
                  },
                ],
              }),
          });
        }
      },
    );

    mockEvaluate.mockImplementation(async (fn: any) => {
      const fnString = fn.toString();
      if (fnString.includes('nome social')) {
        return socialName;
      }
      return {
        email: 'joao@dac.unicamp.br',
        cursoRaw: '42 - Ciência da Computação',
      };
    });
  }

  const createMockSubjectClass = (id: number) =>
    ({
      id,
      availableDays: [],
      subject: { id: 100, code: 'MC102' } as Subject,
      observations: '',
    }) as SubjectClass;

  it('deve usar socialName quando disponível', async () => {
    mockResponses('Joao Victor do Prado');

    mockInstituteRepository.findOrCreate.mockResolvedValue({
      id: 1,
    } as Institute);
    mockCourseRepository.findOrCreate.mockResolvedValue({ id: 10 } as Course);
    mockSubjectRepository.findByCode.mockResolvedValue(null);
    mockSubjectRepository.create.mockResolvedValue({
      id: 100,
    } as SubjectPrisma);

    mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue(null);
    mockSubjectClassRepository.create.mockResolvedValue(
      createMockSubjectClass(200),
    );

    mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue(null);
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 300,
      name: 'Joao Victor do Prado',
      email: 'joao@dac.unicamp.br',
    } as user);

    const result = await service.execute('123456', 'senha');

    expect(mockUserRepository.create).toHaveBeenCalledWith(
      'joao@dac.unicamp.br',
      'Joao Victor do Prado',
      10,
      1,
      3,
    );
    expect(result.name).toBe('Joao Victor do Prado');
    expect(mockClose).toHaveBeenCalled();
  });

  it('deve usar DadosBasicos.Nome quando socialName não está disponível', async () => {
    mockResponses(null);

    mockInstituteRepository.findOrCreate.mockResolvedValue({
      id: 1,
    } as Institute);
    mockCourseRepository.findOrCreate.mockResolvedValue({ id: 10 } as Course);
    mockSubjectRepository.findByCode.mockResolvedValue(null);
    mockSubjectRepository.create.mockResolvedValue({
      id: 100,
    } as SubjectPrisma);

    mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue(null);
    mockSubjectClassRepository.create.mockResolvedValue(
      createMockSubjectClass(200),
    );

    mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue(null);
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 300,
      name: 'João da Silva',
      email: 'joao@dac.unicamp.br',
    } as user);

    const result = await service.execute('123456', 'senha');

    expect(mockUserRepository.create).toHaveBeenCalledWith(
      'joao@dac.unicamp.br',
      'João da Silva',
      10,
      1,
      3,
    );
    expect(result.email).toBe('joao@dac.unicamp.br');
    expect(mockClose).toHaveBeenCalled();
  });

  it('deve atualizar nome com socialName se usuário já existir', async () => {
    mockResponses('Joao Victor do Prado');

    mockInstituteRepository.findOrCreate.mockResolvedValue({
      id: 1,
    } as Institute);
    mockCourseRepository.findOrCreate.mockResolvedValue({ id: 10 } as Course);
    mockSubjectRepository.findByCode.mockResolvedValue({
      id: 100,
    } as SubjectPrisma);

    mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue(
      createMockSubjectClass(200),
    );

    mockUserRepository.findByEmail.mockResolvedValue({
      id: 300,
      name: 'Nome Antigo',
      email: 'joao@dac.unicamp.br',
    } as user);

    mockUserRepository.updateName.mockResolvedValue({
      id: 300,
      name: 'Joao Victor do Prado',
      email: 'joao@dac.unicamp.br',
    } as user);

    mockUserSubjectRepository.findManyByUserId.mockResolvedValue([]);

    mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue({
      id: 999,
    } as UserSubject);

    const result = await service.execute('123456', 'senha');

    expect(mockUserRepository.updateName).toHaveBeenCalledWith(
      300,
      'Joao Victor do Prado',
    );
    expect(result.name).toBe('Joao Victor do Prado');
  });

  it('deve atualizar nome com DadosBasicos.Nome quando socialName é null', async () => {
    mockResponses(null);

    mockInstituteRepository.findOrCreate.mockResolvedValue({
      id: 1,
    } as Institute);
    mockCourseRepository.findOrCreate.mockResolvedValue({ id: 10 } as Course);
    mockSubjectRepository.findByCode.mockResolvedValue({
      id: 100,
    } as SubjectPrisma);

    mockSubjectClassRepository.findBySubjectAndSchedule.mockResolvedValue(
      createMockSubjectClass(200),
    );

    mockUserRepository.findByEmail.mockResolvedValue({
      id: 300,
      name: 'Nome Antigo',
      email: 'joao@dac.unicamp.br',
    } as user);

    mockUserRepository.updateName.mockResolvedValue({
      id: 300,
      name: 'João da Silva',
      email: 'joao@dac.unicamp.br',
    } as user);

    mockUserSubjectRepository.findManyByUserId.mockResolvedValue([]);

    mockUserSubjectRepository.findByUserAndSubjectClass.mockResolvedValue({
      id: 999,
    } as UserSubject);

    const result = await service.execute('123456', 'senha');

    expect(mockUserRepository.updateName).toHaveBeenCalledWith(
      300,
      'João da Silva',
    );
    expect(result.name).toBe('João da Silva');
  });

  it('deve fechar browser e logar erro se falhar', async () => {
    jest
      .mocked(puppeteer.launch)
      .mockRejectedValue(new Error('Falha no browser'));
    await expect(service.execute('123', 'senha')).rejects.toThrow(
      'Falha no browser',
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
