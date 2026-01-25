import { InternalServerErrorException } from '@nestjs/common';

export class UsersCountException extends InternalServerErrorException {
  public readonly code = 'USERS_COUNT_EXCEPTION';

  constructor(message = 'Erro ao contar usuários', error?: unknown) {
    super(
      {
        title: 'Erro ao contar usuários',
        message,
        code: 'USERS_COUNT_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'UsersCountException';
  }
}
