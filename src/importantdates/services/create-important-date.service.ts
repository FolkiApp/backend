import { Injectable, Logger } from '@nestjs/common';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { AuthUser } from 'src/common/guards/auth.guard';
import { ImportantDate } from '../entities/important-date.entity';
import { InvalidRoleException } from '../exceptions/invalid-role.excepetion';
import { CreateImportantDateException } from '../exceptions/create-important-date.exception';

@Injectable()
export class CreateImportantDateService {
  private readonly logger = new Logger(CreateImportantDateService.name);

  constructor(
    private readonly importantDateRepository: ImportantDateRepository,
  ) {}

  async execute(
    data: Omit<ImportantDate, 'id'>,
    user: AuthUser,
  ): Promise<ImportantDate> {
    this.logger.log({ message: 'Executing create important date' });

    if (!user.isAdmin) {
      this.logger.warn({
        message: 'Unauthorized attempt to create important date',
        userId: user.id,
      });
      throw new InvalidRoleException('Unauthorized');
    }

    return this.create(data);
  }

  private async create(
    data: Omit<ImportantDate, 'id'>,
  ): Promise<ImportantDate> {
    try {
      const importantDate = await this.importantDateRepository.create(data);
      this.logger.log({ message: 'Important date created successfully' });
      return importantDate;
    } catch (error) {
      this.logger.error({
        message: 'Error creating important date',
        error,
      });
      throw new CreateImportantDateException(
        'Failed to create important date',
        error,
      );
    }
  }
}
