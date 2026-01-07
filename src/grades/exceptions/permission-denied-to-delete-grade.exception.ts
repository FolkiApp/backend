import { ForbiddenException } from '@nestjs/common';

export class PermissionDeniedToDeleteGradeException extends ForbiddenException {
  public readonly code = 'PERMISSION_DENIED_TO_DELETE_GRADE';

  constructor(
    message = 'Você não tem permissão para deletar essa nota',
    error?: unknown,
  ) {
    super(message, { cause: error });
    this.name = 'PermissionDeniedToDeleteGradeException';
  }
}
