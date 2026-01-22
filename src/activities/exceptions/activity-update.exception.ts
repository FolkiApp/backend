import { InternalServerErrorException } from '@nestjs/common';

export class ActivityUpdateException extends InternalServerErrorException {
  public readonly code = 'ACTIVITY_UPDATE_EXCEPTION';

  constructor(
    message = 'Erro inesperado ao atualizar atividade - Tente novamente mais tarde',
    error?: unknown,
  ) {
    super(
      {
        title: 'ActivityUpdateException',
        message,
        code: 'ACTIVITY_UPDATE_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'ActivityUpdateException';
  }
}
