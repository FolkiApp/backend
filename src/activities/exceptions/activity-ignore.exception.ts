import { InternalServerErrorException } from '@nestjs/common';

export class ActivityIgnoreException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_IGNORE_ERROR';

  constructor(
    message = 'Erro ao marcar atividade como ignorada',
    error?: unknown,
  ) {
    super(
      {
        title: 'ActivityIgnoreException',
        message,
        code: 'ACTIVITY_IGNORE_ERROR',
      },
      { cause: error },
    );
    this.name = 'ActivityIgnoreException';
  }
}
