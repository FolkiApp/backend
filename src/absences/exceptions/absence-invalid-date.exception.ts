import { BadRequestException } from '@nestjs/common';

export class AbsenceInvalidDate extends BadRequestException {
  public readonly code = 'ABSENCE_INVALID_DATE';

  constructor(message = 'Internal error', error?: unknown) {
    super(
      {
        title: 'AbsenceInvalidDate',
        message,
        code: 'ABSENCE_INVALID_DATE',
      },
      { cause: error },
    );
    this.name = 'AbsenceInvalidDate';
  }
}
