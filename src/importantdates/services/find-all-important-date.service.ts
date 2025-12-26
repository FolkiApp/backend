import { Injectable, Logger } from '@nestjs/common';
import { InstituteRepository } from '../../institutes/repositories/institute.repository';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { InvalidUniversityException } from '../../common/exceptions/invalid-university.exception';
import { AuthUser } from '../../common/guards/auth.guard';
import { ImportantDate } from '../entities/important-date.entity';
import { ImportantDateFetchException } from '../exceptions/important-date-fetch.exceptions';

@Injectable()
export class FindAllImportantDateService {
  private readonly logger = new Logger(FindAllImportantDateService.name);
  constructor(
    private readonly instituteRepository: InstituteRepository,
    private readonly importantDatesRepository: ImportantDateRepository,
  ) {}

  async execute(user: AuthUser): Promise<ImportantDate[]> {
    this.logger.log({ message: 'Executing findAll important dates' });
    return this.findAll(user);
  }

  async findAll(user: AuthUser): Promise<ImportantDate[]> {
    try {
      let campusId: number | null = null;

      if (!user.universityId) {
        this.logger.warn({
          message: 'Invalid university ID for user',
          userId: user.id,
        });
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

      const mappedDates = dates.map((date) => ({
        id: date.id,
        name: date.name,
        date: date.date,
        type: date.type,
        shouldNotify: date.shouldNotify,
        campusId: date.campusId,
        universityId: date.universityId,
      }));

      this.logger.log({
        message: 'Successfully fetched important dates',
        userId: user.id,
        count: mappedDates.length,
      });

      return mappedDates;
    } catch (error) {
      this.logger.error({
        message: 'Error finding important dates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new ImportantDateFetchException();
    }
  }
}
