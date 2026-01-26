import { InternalServerErrorException } from '@nestjs/common';

export class PostInternalErrorException extends InternalServerErrorException {
  public readonly code = 'POST_INTERNAL_ERROR_EXCEPTION';

  constructor(message = 'Internal error', error?: unknown) {
    super(
      {
        title: 'Erro interno ao processar postagem',
        message,
        code: 'POST_INTERNAL_ERROR_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'PostInternalErrorException';
  }
}
