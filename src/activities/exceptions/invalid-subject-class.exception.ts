import { BadRequestException } from '@nestjs/common';

export class InvalidSubjectClassException extends BadRequestException {
  public readonly code = 'INVALID_SUBJECT_CLASS';

  constructor(
    message = 'Disciplina inválida - Verifique se a disciplina selecionada é válida',
    error?: unknown,
  ) {
    super(
      {
        title: 'InvalidSubjectClassException',
        message,
        code: 'INVALID_SUBJECT_CLASS',
      },
      { cause: error },
    );
    this.name = 'InvalidSubjectClassException';
  }
}
