import { Test, TestingModule } from '@nestjs/testing';
import { CreateImportantDateService } from '../services/create-important-date.service';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { InvalidRoleException } from '../exceptions/invalid-role.excepetion';
import { CreateImportantDateException } from '../exceptions/create-important-date.exception';
import { AuthUser } from 'src/common/guards/auth.guard';
import {
  ImportantDate,
  ImportantDateType,
} from '../entities/important-date.entity';

describe('CreateImportantDateService', () => {
  let service: CreateImportantDateService;
  let importantDateRepository: ImportantDateRepository;

  const mockImportantDateRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateImportantDateService,
        {
          provide: ImportantDateRepository,
          useValue: mockImportantDateRepository,
        },
      ],
    }).compile();

    service = module.get<CreateImportantDateService>(
      CreateImportantDateService,
    );
    importantDateRepository = module.get<ImportantDateRepository>(
      ImportantDateRepository,
    );
  });

  describe('execute', () => {
    const mockData: Omit<ImportantDate, 'id'> = {
      name: 'Semester start',
      date: new Date('2025-03-10'),
      type: ImportantDateType.GENERAL,
      shouldNotify: true,
      campusId: null,
      universityId: 1,
    };

    const mockAdminUser: AuthUser = {
      id: 1,
      isAdmin: true,
    } as AuthUser;

    const mockNonAdminUser: AuthUser = {
      id: 2,
      isAdmin: false,
    } as AuthUser;

    it('cria uma data importante quando o usuário é admin', async () => {
      const mockCreatedDate: ImportantDate = {
        id: 1,
        ...mockData,
      };

      mockImportantDateRepository.create.mockResolvedValue(mockCreatedDate);

      const result = await service.execute(mockData, mockAdminUser);

      expect(result).toEqual(mockCreatedDate);
      expect(importantDateRepository.create).toHaveBeenCalledWith(mockData);
      expect(importantDateRepository.create).toHaveBeenCalledTimes(1);
    });

    it('lança InvalidRoleException quando o usuário não é admin', async () => {
      await expect(service.execute(mockData, mockNonAdminUser)).rejects.toThrow(
        InvalidRoleException,
      );

      expect(importantDateRepository.create).not.toHaveBeenCalled();
    });

    it('lança CreateImportantDateException quando o repository falha', async () => {
      mockImportantDateRepository.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.execute(mockData, mockAdminUser)).rejects.toThrow(
        CreateImportantDateException,
      );

      expect(importantDateRepository.create).toHaveBeenCalledWith(mockData);
    });
  });
});
