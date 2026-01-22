import { InternalServerErrorException } from '@nestjs/common';

export class InvalidRoleException extends InternalServerErrorException {
  public readonly code = 'INVALID_ROLE';

  constructor(
    message = 'Erro ao tentar criar data importante',
    error?: unknown,
  ) {
    super(
      {
        title: 'InvalidRoleException',
        message,
        code: 'INVALID_ROLE',
      },
      { cause: error },
    );
    this.name = 'InvalidRoleException';
  }
}
