import { ForbiddenException } from '@nestjs/common';

export class ForbiddenPostException extends ForbiddenException {
  public readonly code = 'FORBIDDEN_POST_EXCEPTION';

  constructor(message = 'Forbidden error', error?: unknown) {
    super(
      {
        title: 'Você não tem permissão para deletar este post',
        message,
        code: 'FORBIDDEN_POST_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'ForbiddenPostException';
  }
}
