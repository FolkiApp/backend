import { BadRequestException } from '@nestjs/common';

export class InvalidSubjectIdException extends BadRequestException {
  public readonly code = 'INVALID_SUBJECT_ID_EXCEPTION';

  constructor(message = 'SubjectID é inválido', error?: unknown) {
    super(message, { cause: error });
    this.name = 'InvalidSubjectIdException';
  }
}
