import { ForbiddenException } from '@nestjs/common';

export class PermissionDeniedException extends ForbiddenException {
  public readonly code = 'PERMISSION_DENIED';

  constructor(
    message = 'Você não tem permissão para atualizar essa atividade',
    error?: unknown,
  ) {
    super(
      {
        title: 'Permissão negada',
        message,
        code: 'PERMISSION_DENIED',
      },
      { cause: error },
    );
    this.name = 'PermissionDeniedException';
  }
}
