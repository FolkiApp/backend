import { Injectable, Logger } from '@nestjs/common';
import { UniversityRepository } from '../repositories/university.repository';
import { University } from '../entities/university.entity';
import { UniversityFetchException } from '../exceptions/university-fetch.exception';

@Injectable()
export class FindAllUniversitiesService {
  private readonly logger = new Logger(FindAllUniversitiesService.name);

  constructor(private readonly universityRepository: UniversityRepository) {}

  async execute(): Promise<University[]> {
    this.logger.log('Executing findAll universities');
    return this.findAll();
  }

  async findAll(): Promise<University[]> {
    try {
      const universities = await this.universityRepository.findAll();
      this.logger.log(`Found ${universities.length} universities`);
      return universities;
    } catch (error) {
      this.logger.error('Error finding all universities', error);
      throw new UniversityFetchException();
    }
  }
}
