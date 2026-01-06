import { BadRequestException } from '@nestjs/common';

export class InvalidSubjectClassException extends BadRequestException {
  public readonly code = 'INVALID_SUBJECT_CLASS';

  constructor(
    message = 'Disciplina inválida - Verifique se a disciplina selecionada é válida',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'InvalidSubjectClassException';
  }
}
