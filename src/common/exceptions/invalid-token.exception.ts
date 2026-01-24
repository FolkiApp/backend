import { UnauthorizedException } from '@nestjs/common';

export class InvalidTokenException extends UnauthorizedException {
  public readonly code = 'INVALID_TOKEN';

  constructor(message = 'Token inválido ou expirado', error?: unknown) {
    super(
      {
        title: 'Token inválido',
        message,
        code: 'INVALID_TOKEN',
      },
      { cause: error },
    );
    this.name = 'InvalidTokenException';
  }
}
