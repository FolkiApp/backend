import { Injectable, Logger } from '@nestjs/common';
import { ImportantDateRepository } from '../repositories/important-date.repository';
import { DeletedImportantDateException } from '../exceptions/delete-important-date.exception';

@Injectable()
export class DeleteImportantDateService {
  private readonly logger = new Logger(DeleteImportantDateService.name);

  constructor(
    private readonly importantDateRepository: ImportantDateRepository,
  ) {}

  async execute(importantDateId: number): Promise<void> {
    this.logger.log({ message: 'Executing delete important date' });
    await this.delete(importantDateId);
  }

  private async delete(importantDateId: number): Promise<void> {
    try {
      await this.importantDateRepository.delete(importantDateId);
      this.logger.log({ message: 'Important date deleted successfully' });
    } catch (error) {
      this.logger.error({
        message: 'Error deleting important date',
        error:
          error instanceof DeletedImportantDateException
            ? error.message
            : 'Unknown error',
      });
      throw new DeletedImportantDateException(
        'Failed to delete important date',
      );
    }
  }
}
