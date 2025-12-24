import { Injectable, Logger } from '@nestjs/common';
import { UniversityRepository } from '../repositories/university.repository';
import { University } from '../entities/university.entity';
import { UniversityFetchException } from '../exceptions/university-fetch.exception';

@Injectable()
export class FindAllUniversitiesService {
  private readonly logger = new Logger(FindAllUniversitiesService.name);

  constructor(private readonly universityRepository: UniversityRepository) {}

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
