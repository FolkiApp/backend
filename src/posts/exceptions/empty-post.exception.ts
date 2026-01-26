import { BadRequestException } from '@nestjs/common';

export class EmptyPostException extends BadRequestException {
  public readonly code = 'EMPTY_POST_EXCEPTION';

  constructor(message = 'Internal error', error?: unknown) {
    super(
      {
        title: 'Titulo e/ou conteúdo da postagem não podem ser vazios',
        message,
        code: 'EMPTY_POST_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'EmptyPostException';
  }
}
