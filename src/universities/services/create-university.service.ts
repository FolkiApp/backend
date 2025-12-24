import { Injectable, Logger } from '@nestjs/common';
import { UniversityRepository } from '../repositories/university.repository';
import { CreateUniversityDto } from '../dto/create-university.dto';
import { University } from '../entities/university.entity';
import { UniversityAlreadyExistsException } from '../exceptions/university-already-exists.exception';

@Injectable()
export class CreateUniversityService {
  private readonly logger = new Logger(CreateUniversityService.name);

  constructor(private readonly universityRepository: UniversityRepository) {}

  async execute(data: CreateUniversityDto): Promise<University> {
    this.logger.log(`Creating university with slug: ${data.slug}`);

    const existingUniversity = await this.universityRepository.findBySlug(
      data.slug,
    );

    if (existingUniversity) {
      this.logger.warn(`University with slug ${data.slug} already exists`);
      throw new UniversityAlreadyExistsException();
    }

    const university = await this.universityRepository.create(data);
    this.logger.log(`University created with id: ${university.id}`);

    return university;
  }
}
