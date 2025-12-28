import { InternalServerErrorException } from '@nestjs/common';

export class AbsenceInternalErrorException extends InternalServerErrorException {
  public readonly code = 'ABSENCE_INTERNAL_ERROR_EXCEPTION';

  constructor(message = 'Internal error', error?: unknown) {
    super(message, { cause: error });
    this.name = 'AbsenceInternalErrorException';
  }
}
