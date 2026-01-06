import { ForbiddenException } from '@nestjs/common';

export class PermissionDeniedException extends ForbiddenException {
  public readonly code = 'PERMISSION_DENIED';

  constructor(
    message = 'Você não tem permissão para atualizar essa atividade',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'PermissionDeniedException';
  }
}
