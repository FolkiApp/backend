import { Test, TestingModule } from '@nestjs/testing';
import { AbsenceController } from '../absence.controller';
import { AbsenceBySubjectService } from '../services/find-absence-by-subject.service';
import { UserAbsence } from '../entities/absence.entity';
import { AbsenceDto } from '../dto/absence.dto';

describe('AbsenceController', () => {
  let controller: AbsenceController;
  let absenceService: AbsenceBySubjectService;

  const mockAuthUser = {
    id: 3,
    email: 'user@example.com',
    name: 'Test User',
    isAdmin: false,
    instituteId: 1,
    courseId: 2,
    universityId: 1,
    isBlocked: false,
    userVersion: '1.0',
  };

  const mockAbsenceService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbsenceController],
      providers: [
        {
          provide: AbsenceBySubjectService,
          useValue: mockAbsenceService,
        },
      ],
    }).compile();

    controller = module.get<AbsenceController>(AbsenceController);
    absenceService = module.get<AbsenceBySubjectService>(
      AbsenceBySubjectService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllBySubject', () => {
    it('deve retornar faltas de uma disciplina formatadas como DTO', async () => {
      const mockAbsences = [
        new UserAbsence(
          1,
          new Date('2025-03-10'),
          new Date('2025-03-10T12:30:00'),
          3,
          7,
        ),
        new UserAbsence(
          2,
          new Date('2025-03-15'),
          new Date('2025-03-15T10:00:00'),
          3,
          7,
        ),
      ];

      mockAbsenceService.execute.mockResolvedValue(mockAbsences);

      const result = await controller.findAllBySubject(7, mockAuthUser);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AbsenceDto);
      expect(result[0].id).toBe(1);
      expect(result[0].userId).toBe(3);
      expect(result[0].userSubjectId).toBe(7);
      expect(result[1].id).toBe(2);
      expect(absenceService.execute).toHaveBeenCalledWith(mockAuthUser, 7);
    });

    it('deve lançar exceção quando o serviço lança um erro', async () => {
      const error = new Error('Service error');
      mockAbsenceService.execute.mockRejectedValue(error);

      await expect(
        controller.findAllBySubject(7, mockAuthUser),
      ).rejects.toThrow(error);
      expect(absenceService.execute).toHaveBeenCalledWith(mockAuthUser, 7);
    });

    it('deve mapear corretamente os dados de UserAbsence para AbsenceDto', async () => {
      const mockAbsence = new UserAbsence(
        5,
        new Date('2025-03-20'),
        new Date('2025-03-20T14:00:00'),
        10,
        15,
      );

      mockAbsenceService.execute.mockResolvedValue([mockAbsence]);

      const result = await controller.findAllBySubject(15, {
        id: 10,
        email: 'user@example.com',
        name: 'Test User',
        isAdmin: false,
        instituteId: 1,
        courseId: 2,
        universityId: 1,
        isBlocked: false,
        userVersion: '1.0',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(5);
      expect(result[0].date).toEqual(new Date('2025-03-20'));
      expect(result[0].createdAt).toEqual(new Date('2025-03-20T14:00:00'));
      expect(result[0].userId).toBe(10);
      expect(result[0].userSubjectId).toBe(15);
    });
  });
});
