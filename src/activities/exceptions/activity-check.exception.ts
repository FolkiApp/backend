import { InternalServerErrorException } from '@nestjs/common';

export class ActivityCheckException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_CHECK_ERROR';

  constructor(
    message = 'Erro ao marcar atividade como concluída',
    error?: unknown,
  ) {
    super(
      {
        title: 'ActivityCheckException',
        message,
        code: 'ACTIVITY_CHECK_ERROR',
      },
      { cause: error },
    );
    this.name = 'ActivityCheckException';
  }
}
