import { InternalServerErrorException } from '@nestjs/common';

export class FindUserSubjectsException extends InternalServerErrorException {
  public readonly code = 'FIND_USER_SUBJECTS_EXCEPTION';

  constructor(
    message = 'Erro ao buscar disciplinas do usuário',
    error?: unknown,
  ) {
    super(
      {
        title: 'Erro ao buscar disciplinas do usuário',
        message,
        code: 'FIND_USER_SUBJECTS_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'FindUserSubjectsException';
  }
}
