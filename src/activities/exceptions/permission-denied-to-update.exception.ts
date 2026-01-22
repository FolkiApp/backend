import { ForbiddenException } from '@nestjs/common';

export class PermissionDeniedToUpdateException extends ForbiddenException {
  public readonly code = 'PERMISSION_DENIED_TO_UPDATE';

  constructor(
    message = 'Você não tem permissão para atualizar essa atividade',
    error?: unknown,
  ) {
    super(
      {
        title: 'PermissionDeniedToUpdateException',
        message,
        code: 'PERMISSION_DENIED_TO_UPDATE',
      },
      { cause: error },
    );
    this.name = 'PermissionDeniedToUpdateException';
  }
}
