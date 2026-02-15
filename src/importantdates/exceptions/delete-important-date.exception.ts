import { InternalServerErrorException } from '@nestjs/common';

export class DeletedImportantDateException extends InternalServerErrorException {
  public readonly code = 'DELETE_IMPORTANT_DATE_ERROR';

  constructor(
    message = 'Erro ao tentar deletar data importante',
    error?: unknown,
  ) {
    super(
      {
        title: 'Erro ao deletar data importante',
        message,
        code: 'DELETE_IMPORTANT_DATE_ERROR',
      },
      { cause: error },
    );
    this.name = 'DeleteImportantDateException';
  }
}
