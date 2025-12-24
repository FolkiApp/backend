import { UnauthorizedException } from '@nestjs/common';

export class InvalidAuthHeaderException extends UnauthorizedException {
  public readonly code = 'INVALID_AUTH_HEADER';

  constructor() {
    super('Header de Autorização inválido');
    this.name = 'InvalidAuthHeaderException';
  }
}
