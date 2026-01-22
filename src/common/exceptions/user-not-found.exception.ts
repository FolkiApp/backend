import { UnauthorizedException } from '@nestjs/common';

export class UserNotFoundException extends UnauthorizedException {
  public readonly code = 'USER_NOT_FOUND';

  constructor(message = 'Usuário não existe', error?: unknown) {
    super(
      {
        title: 'UserNotFoundException',
        message,
        code: 'USER_NOT_FOUND',
      },
      { cause: error },
    );
    this.name = 'UserNotFoundException';
  }
}
