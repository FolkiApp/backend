import { InternalServerErrorException } from '@nestjs/common';

export class ActivityUnignoreException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_UNIGNORE_ERROR';

  constructor(
    message = 'Erro ao desmarcar atividade como ignorada',
    error?: unknown,
  ) {
    super(
      {
        title: 'Erro ao deixar de ignorar atividade',
        message,
        code: 'ACTIVITY_UNIGNORE_ERROR',
      },
      { cause: error },
    );
    this.name = 'ActivityUnignoreException';
  }
}
