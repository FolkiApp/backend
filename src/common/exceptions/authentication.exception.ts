import { InternalServerErrorException } from '@nestjs/common';

export class AuthenticationException extends InternalServerErrorException {
  public readonly code = 'AUTHENTICATION_ERROR';

  constructor(
    message = 'Erro inesperado ao autenticar usuário. Tente novamente mais tarde.',
    error?: unknown,
  ) {
    super(
      {
        title: 'Erro ao autenticar',
        message,
        code: 'AUTHENTICATION_ERROR',
      },
      { cause: error },
    );
    this.name = 'AuthenticationException';
  }
}
