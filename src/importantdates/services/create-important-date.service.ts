import { Injectable } from '@nestjs/common';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { ImportantDate } from '../entities/important-date.entity';
import { CreateImportantDateException } from '../exceptions/create-important-date.exception';
import { CreateImportantDateDto } from '../dtos/create-important-date.dto';

@Injectable()
export class CreateImportantDateService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly importantDateRepository: ImportantDateRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(CreateImportantDateService.name);
  }

  async execute(data: CreateImportantDateDto): Promise<ImportantDate> {
    this.logger.log({ message: 'Executing create important date' });
    return this.create(data);
  }

  private async create(data: CreateImportantDateDto): Promise<ImportantDate> {
    try {
      const importantDate = await this.importantDateRepository.create({
        ...data,
        date: new Date(data.date),
      });

      this.logger.log({ message: 'Important date created successfully' });
      return importantDate;
    } catch (error) {
      this.logger.error({
        message: 'Error creating important date',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new CreateImportantDateException(
        'Failed to create important date',
        error,
      );
    }
  }
}
