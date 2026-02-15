import { Injectable } from '@nestjs/common';
import { UniversityRepository } from '../repositories/university.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { University } from '../entities/university.entity';
import { UniversityFetchException } from '../exceptions/university-fetch.exception';

@Injectable()
export class FindAllUniversitiesService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly universityRepository: UniversityRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(FindAllUniversitiesService.name);
  }

  async execute(): Promise<University[]> {
    this.logger.log({ message: 'Executing findAll universities' });
    return this.findAll();
  }

  async findAll(): Promise<University[]> {
    try {
      const universities = await this.universityRepository.findAll();
      this.logger.log({
        message: 'Found universities',
        count: universities.length,
      });
      return universities;
    } catch (error) {
      this.logger.error({
        message: 'Error finding all universities',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new UniversityFetchException();
    }
  }
}
