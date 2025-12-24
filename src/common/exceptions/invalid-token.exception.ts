import { UnauthorizedException } from '@nestjs/common';

export class InvalidTokenException extends UnauthorizedException {
  public readonly code = 'INVALID_TOKEN';

  constructor() {
    super('Token inválido ou expirado');
    this.name = 'InvalidTokenException';
  }
}
