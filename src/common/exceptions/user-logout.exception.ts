import { UnauthorizedException } from '@nestjs/common';

export class UserLogoutException extends UnauthorizedException {
  public readonly code = 'USER_LOGOUT';

  constructor(message = 'Usuário deslogado', error?: unknown) {
    super(
      {
        title: 'Usuário deslogado',
        message,
        code: 'USER_LOGOUT',
      },
      { cause: error },
    );
    this.name = 'UserLogoutException';
  }
}
