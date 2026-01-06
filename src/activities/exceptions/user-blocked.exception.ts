import { ForbiddenException } from '@nestjs/common';

export class UserBlockedException extends ForbiddenException {
  public readonly code = 'USER_BLOCKED';

  constructor(
    message = 'Você foi bloqueado do Folki e não tem permissão para criar atividades',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'UserBlockedException';
  }
}
