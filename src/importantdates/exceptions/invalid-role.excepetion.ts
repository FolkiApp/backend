import { InternalServerErrorException } from '@nestjs/common';

export class InvalidRoleException extends InternalServerErrorException {
  public readonly code = 'INVALID_ROLE';

  constructor(
    message = 'Erro ao tentar criar data importante',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'InvalidRole';
  }
}
