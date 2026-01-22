import { UnauthorizedException } from '@nestjs/common';

export class InvalidTokenException extends UnauthorizedException {
  public readonly code = 'INVALID_TOKEN';

  constructor(message = 'Token inválido ou expirado', error?: unknown) {
    super(
      {
        title: 'InvalidTokenException',
        message,
        code: 'INVALID_TOKEN',
      },
      { cause: error },
    );
    this.name = 'InvalidTokenException';
  }
}
