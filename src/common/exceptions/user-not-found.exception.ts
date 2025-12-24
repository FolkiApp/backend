import { UnauthorizedException } from '@nestjs/common';

export class UserNotFoundException extends UnauthorizedException {
  public readonly code = 'USER_NOT_FOUND';

  constructor() {
    super('Usuário não existe');
    this.name = 'UserNotFoundException';
  }
}
