import { InternalServerErrorException } from '@nestjs/common';

export class GradesFetchException extends InternalServerErrorException {
  public readonly code = 'GRADES_FETCH_ERROR';

  constructor(message = 'Erro ao obter notas', error?: unknown) {
    super(
      {
        title: 'Erro ao buscar notas',
        message,
        code: 'GRADES_FETCH_ERROR',
      },
      { cause: error },
    );
    this.name = 'GradesFetchException';
  }
}
