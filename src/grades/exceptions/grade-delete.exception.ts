import { InternalServerErrorException } from '@nestjs/common';

export class GradeDeleteException extends InternalServerErrorException {
  public readonly code = 'GRADE_DELETE_EXCEPTION';

  constructor(message = 'Erro ao deletar nota', error?: unknown) {
    super(
      {
        title: 'GradeDeleteException',
        message,
        code: 'GRADE_DELETE_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'GradeDeleteException';
  }
}
