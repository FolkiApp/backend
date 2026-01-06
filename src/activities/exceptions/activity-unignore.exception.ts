import { InternalServerErrorException } from '@nestjs/common';

export class ActivityUnignoreException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_UNIGNORE_ERROR';

  constructor(error?: unknown) {
    super('Erro ao desmarcar atividade como ignorada', { cause: error });
    this.name = 'ActivityUnignoreException';
  }
}
