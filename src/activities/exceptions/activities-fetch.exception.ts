import { InternalServerErrorException } from '@nestjs/common';

export class ActivitiesFetchException extends InternalServerErrorException {
  public readonly code = 'ACTIVITIES_FETCH_EXCEPTION';

  constructor(message = 'Erro ao buscar atividades', error?: unknown) {
    super(
      {
        title: 'Erro ao buscar atividades',
        message,
        code: 'ACTIVITIES_FETCH_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'ActivitiesFetchException';
  }
}
