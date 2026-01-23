import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  public readonly code = 'INVALID_CREDENTIALS';

  constructor(
    message = 'Credenciais inválidas - Verifique seu usuário e senha',
    error?: unknown,
  ) {
    super(
      {
        title: 'Credenciais inválidas',
        message,
        code: 'INVALID_CREDENTIALS',
      },
      { cause: error },
    );
    this.name = 'InvalidCredentialsException';
  }
}
