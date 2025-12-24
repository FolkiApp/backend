import { InternalServerErrorException } from '@nestjs/common';

export class AuthenticationException extends InternalServerErrorException {
  public readonly code = 'AUTHENTICATION_ERROR';

  constructor(
    message = 'Erro inesperado ao autenticar usuário',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'AuthenticationException';
  }
}
