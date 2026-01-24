import { InternalServerErrorException } from '@nestjs/common';

export class AbsenceInternalErrorException extends InternalServerErrorException {
  public readonly code = 'ABSENCE_INTERNAL_ERROR_EXCEPTION';

  constructor(message = 'Internal error', error?: unknown) {
    super(
      {
        title: 'Erro interno ao processar faltas',
        message,
        code: 'ABSENCE_INTERNAL_ERROR_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'AbsenceInternalErrorException';
  }
}
