import { InternalServerErrorException } from '@nestjs/common';

export class ActivityUncheckException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_UNCHECK_ERROR';

  constructor(error?: unknown) {
    super('Erro ao desmarcar atividade como concluída', { cause: error });
    this.name = 'ActivityUncheckException';
  }
}
