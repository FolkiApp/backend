import { ForbiddenException } from '@nestjs/common';

export class PermissionDeniedToUpdateException extends ForbiddenException {
  public readonly code = 'PERMISSION_DENIED_TO_UPDATE';

  constructor(
    message = 'Você não tem permissão para atualizar essa atividade',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'PermissionDeniedToUpdateException';
  }
}
