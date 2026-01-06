import { InternalServerErrorException } from '@nestjs/common';

export class ActivityIgnoreException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_IGNORE_ERROR';

  constructor(error?: unknown) {
    super('Erro ao marcar atividade como ignorada', { cause: error });
    this.name = 'ActivityIgnoreException';
  }
}
