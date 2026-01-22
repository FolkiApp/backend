import { InternalServerErrorException } from '@nestjs/common';

export class ActivityUncheckException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_UNCHECK_ERROR';

  constructor(
    message = 'Erro ao desmarcar atividade como concluída',
    error?: unknown,
  ) {
    super(
      {
        title: 'ActivityUncheckException',
        message,
        code: 'ACTIVITY_UNCHECK_ERROR',
      },
      { cause: error },
    );
    this.name = 'ActivityUncheckException';
  }
}
