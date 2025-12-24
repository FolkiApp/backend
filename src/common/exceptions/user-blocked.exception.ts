import { UnauthorizedException } from '@nestjs/common';

export class UserBlockedException extends UnauthorizedException {
  public readonly code = 'USER_BLOCKED';

  constructor() {
    super('Usuário impedido de fazer login');
    this.name = 'UserBlockedException';
  }
}
