import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  public readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Credenciais inválidas - Verifique seu usuário e senha');
    this.name = 'InvalidCredentialsException';
  }
}
