import { NotFoundException } from '@nestjs/common';

export class GradeNotFoundException extends NotFoundException {
  public readonly code = 'GRADE_NOT_FOUND';

  constructor(message = 'Nota não encontrada', error?: unknown) {
    super(
      {
        title: 'Nota não encontrada',
        message,
        code: 'GRADE_NOT_FOUND',
      },
      { cause: error },
    );
    this.name = 'GradeNotFoundException';
  }
}
