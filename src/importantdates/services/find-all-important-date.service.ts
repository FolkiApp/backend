import { Injectable, Logger } from '@nestjs/common';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { InvalidUniversityException } from '../../common/exceptions/invalid-university.exception';
import { AuthUser } from '../../common/guards/auth.guard';
import { importantDates } from '../entities/importante-date.entity';

@Injectable()
export class FindAllImportantDate {
  private readonly logger = new Logger(FindAllImportantDate.name);
  constructor(
    private readonly instituteRepository: InstituteRepository,
    private readonly importantDatesRepository: ImportantDateRepository,
  ) {}

  async execute(user: AuthUser): Promise<importantDates[]> {
    this.logger.log({ message: 'Executing findAll important dates' });
    return this.findAll(user);
  }

  async findAll(user: AuthUser): Promise<importantDates[]> {
    let campusId: number | null = null;

    if (!user.universityId) {
      throw new InvalidUniversityException();
    }

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    if (user.instituteId) {
      const institute = await this.instituteRepository.findById(
        user.instituteId,
      );
      campusId = institute?.campusId ?? null;
    }

    const dates = await this.importantDatesRepository.findAll(
      startOfYear,
      user.universityId,
      campusId,
    );

    return dates.map((date) => ({
      id: date.id,
      name: date.name,
      date: date.date,
      type: date.type,
      shouldNotify: date.shouldNotify,
      campusId: date.campusId,
      universityId: date.universityId,
    }));
  }
}
