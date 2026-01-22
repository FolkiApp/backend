import { UnauthorizedException } from '@nestjs/common';

export class AbsenceUnauthorized extends UnauthorizedException {
  public readonly code = 'ABSENCE_ACESS_UNAUTHORIZED';

  constructor(message = 'Absence não pertence ao usuário', error?: unknown) {
    super(
      {
        title: 'AbsenceUnauthorized',
        message,
        code: 'ABSENCE_ACESS_UNAUTHORIZED',
      },
      { cause: error },
    );
    this.name = 'AbsenceUnauthorized';
  }
}
