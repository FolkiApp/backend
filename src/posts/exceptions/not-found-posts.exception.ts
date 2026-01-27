import { NotFoundException } from '@nestjs/common';

export class NotFoundPostException extends NotFoundException {
  public readonly code = 'NOT_FOUND_POSTS_EXCEPTION';

  constructor(message = 'Not found error', error?: unknown) {
    super(
      {
        title: 'Nenhum post foi encontrado',
        message,
        code: 'NOT_FOUND_POSTS_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'NotFoundPostException';
  }
}
