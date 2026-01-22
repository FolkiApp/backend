import { NotFoundException } from '@nestjs/common';

export class NotFoundAbsences extends NotFoundException {
  public readonly code = 'NOT_FOUND_ABSENCES';

  constructor(message = 'Nenhuma absence encontrada', error?: unknown) {
    super(
      {
        title: 'NotFoundAbsences',
        message,
        code: 'NOT_FOUND_ABSENCES',
      },
      { cause: error },
    );
    this.name = 'NotFoundAbsences';
  }
}
