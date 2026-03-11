import { InternalServerErrorException } from '@nestjs/common';

export class AddBadgeException extends InternalServerErrorException {
  public readonly code = 'ADD_BADGE_EXCEPTION';

  constructor(message = 'Erro ao adicionar badge ao usuário', error?: unknown) {
    super(
      {
        title: 'Erro ao adicionar badge ao usuário',
        message,
        code: 'ADD_BADGE_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'AddBadgeException';
  }
}
