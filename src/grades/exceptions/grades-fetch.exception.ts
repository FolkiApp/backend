import { InternalServerErrorException } from '@nestjs/common';

export class GradesFetchException extends InternalServerErrorException {
  public readonly code = 'GRADES_FETCH_ERROR';

  constructor(error?: unknown) {
    super('Erro ao obter notas', { cause: error });
    this.name = 'GradesFetchException';
  }
}
