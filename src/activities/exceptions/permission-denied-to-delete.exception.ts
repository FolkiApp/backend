import { ForbiddenException } from '@nestjs/common';

export class PermissionDeniedToDeleteException extends ForbiddenException {
  public readonly code = 'PERMISSION_DENIED_TO_DELETE';

  constructor(
    message = 'Você não tem permissão para deletar essa atividade',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'PermissionDeniedToDeleteException';
  }
}
