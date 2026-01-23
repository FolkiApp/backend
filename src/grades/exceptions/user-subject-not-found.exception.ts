import { NotFoundException } from '@nestjs/common';

export class UserSubjectNotFoundException extends NotFoundException {
  public readonly code = 'USER_SUBJECT_NOT_FOUND';

  constructor(message = 'Matéria não encontrada', error?: unknown) {
    super(
      {
        title: 'Matéria não encontrada',
        message,
        code: 'USER_SUBJECT_NOT_FOUND',
      },
      { cause: error },
    );
    this.name = 'UserSubjectNotFoundException';
  }
}
