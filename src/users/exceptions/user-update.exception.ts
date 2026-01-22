import { InternalServerErrorException } from '@nestjs/common';

export class UserUpdateException extends InternalServerErrorException {
  public readonly code = 'USER_UPDATE_EXCEPTION';

  constructor(message = 'Erro ao atualizar usuário', error?: unknown) {
    super(
      {
        title: 'UserUpdateException',
        message,
        code: 'USER_UPDATE_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'UserUpdateException';
  }
}
