import { InternalServerErrorException } from '@nestjs/common';

export class ActivityCheckException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_CHECK_ERROR';

  constructor(error?: unknown) {
    super('Erro ao marcar atividade como concluída', { cause: error });
    this.name = 'ActivityCheckException';
  }
}
