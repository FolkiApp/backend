import { InternalServerErrorException } from '@nestjs/common';

export class CreateImportantDateException extends InternalServerErrorException {
  public readonly code = 'CREATE_IMPORTANT_DATE_ERROR';

  constructor(
    message = 'Erro ao tentar criar data importante',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'CreateImportantDate';
  }
}
