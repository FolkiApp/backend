import { InternalServerErrorException } from '@nestjs/common';

export class ActivityCreateException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_CREATE_EXCEPTION';

  constructor(message = 'Erro ao criar atividade', error?: unknown) {
    super(
      {
        title: 'Erro ao criar atividade',
        message,
        code: 'ACTIVITY_CREATE_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'ActivityCreateException';
  }
}
