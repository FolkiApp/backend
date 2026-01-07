import { NotFoundException } from '@nestjs/common';

export class GradeNotFoundException extends NotFoundException {
  public readonly code = 'GRADE_NOT_FOUND';

  constructor(message = 'Nota não encontrada', error?: unknown) {
    super(message, { cause: error });
    this.name = 'GradeNotFoundException';
  }
}
