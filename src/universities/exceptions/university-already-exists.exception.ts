import { ConflictException } from '@nestjs/common';

export class UniversityAlreadyExistsException extends ConflictException {
  public readonly code = 'UNIVERSITY_ALREADY_EXISTS';

  constructor(message = 'Universidade já existe', error?: unknown) {
    super(
      {
        title: 'Universidade já existe',
        message,
        code: 'UNIVERSITY_ALREADY_EXISTS',
      },
      { cause: error },
    );
    this.name = 'UniversityAlreadyExistsException';
  }
}
