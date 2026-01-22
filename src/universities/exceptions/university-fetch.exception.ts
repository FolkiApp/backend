import { InternalServerErrorException } from '@nestjs/common';

export class UniversityFetchException extends InternalServerErrorException {
  public readonly code = 'UNIVERSITY_FETCH_EXCEPTION';

  constructor(message = 'Erro ao buscar universidades', error?: unknown) {
    super(
      {
        title: 'UniversityFetchException',
        message,
        code: 'UNIVERSITY_FETCH_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'UniversityFetchException';
  }
}
