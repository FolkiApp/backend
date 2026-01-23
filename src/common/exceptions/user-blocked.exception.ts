import { UnauthorizedException } from '@nestjs/common';

export class UserBlockedException extends UnauthorizedException {
  public readonly code = 'USER_BLOCKED';

  constructor(message = 'Usuário impedido de fazer login', error?: unknown) {
    super(
      {
        title: 'Usuário bloqueado',
        message,
        code: 'USER_BLOCKED',
      },
      { cause: error },
    );
    this.name = 'UserBlockedException';
  }
}
