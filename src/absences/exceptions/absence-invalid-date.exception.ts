import { BadRequestException } from '@nestjs/common';

export class AbsenceInvalidDate extends BadRequestException {
  public readonly code = 'ABSENCE_INVALID_DATE';

  constructor(message = 'Internal error', error?: unknown) {
    super(message, { cause: error });
    this.name = 'AbsenceInvalidDate';
  }
}
