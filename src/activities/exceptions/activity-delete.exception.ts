import { InternalServerErrorException } from '@nestjs/common';

export class ActivityDeleteException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_DELETE_ERROR';

  constructor(message = 'Erro ao deletar atividade', error?: unknown) {
    super(
      {
        title: 'Erro ao deletar atividade',
        message,
        code: 'ACTIVITY_DELETE_ERROR',
      },
      { cause: error },
    );
    this.name = 'ActivityDeleteException';
  }
}
