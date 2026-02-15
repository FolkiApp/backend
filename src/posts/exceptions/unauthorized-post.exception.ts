import { UnauthorizedException } from '@nestjs/common';

export class UnauthorizedPostException extends UnauthorizedException {
  public readonly code = 'UNAUTHORIZED_POST_EXCEPTION';

  constructor(message = 'Não autorizado', error?: unknown) {
    super(
      {
        title: 'Você não tem permissão para deletar este post',
        message,
        code: 'UNAUTHORIZED_POST_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'UnauthorizedPostException';
  }
}
