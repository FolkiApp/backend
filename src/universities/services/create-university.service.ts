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
    this.logger.log({
      message: 'Creating university',
      slug: data.slug,
      name: data.name,
    });

    const existingUniversity = await this.universityRepository.findBySlug(
      data.slug,
    );

    if (existingUniversity) {
      this.logger.warn({
        message: 'University already exists',
        slug: data.slug,
        existingId: existingUniversity.id,
      });
      throw new UniversityAlreadyExistsException();
    }

    const university = await this.universityRepository.create(data);
    this.logger.log({
      message: 'University created',
      id: university.id,
      slug: university.slug,
      name: university.name,
    });

    return university;
  }
}
