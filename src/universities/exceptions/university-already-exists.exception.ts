import { ConflictException } from '@nestjs/common';

export class UniversityAlreadyExistsException extends ConflictException {
  public readonly code = 'UNIVERSITY_ALREADY_EXISTS';

  constructor() {
    super('Universidade já existe');
    this.name = 'UniversityAlreadyExistsException';
  }
}
