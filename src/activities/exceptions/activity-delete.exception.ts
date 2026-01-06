import { InternalServerErrorException } from '@nestjs/common';

export class ActivityDeleteException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_DELETE_ERROR';

  constructor(error?: unknown) {
    super('Erro ao deletar atividade', { cause: error });
    this.name = 'ActivityDeleteException';
  }
}
