import { UnauthorizedException } from '@nestjs/common';

export class InvalidAuthHeaderException extends UnauthorizedException {
  public readonly code = 'INVALID_AUTH_HEADER';

  constructor(message = 'Header de Autorização inválido', error?: unknown) {
    super(
      {
        title: 'InvalidAuthHeaderException',
        message,
        code: 'INVALID_AUTH_HEADER',
      },
      { cause: error },
    );
    this.name = 'InvalidAuthHeaderException';
  }
}
