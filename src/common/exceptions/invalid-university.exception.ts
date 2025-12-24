import { BadRequestException } from '@nestjs/common';

export class InvalidUniversityException extends BadRequestException {
  public readonly code = 'INVALID_UNIVERSITY';

  constructor() {
    super('Universidade não encontrada');
    this.name = 'InvalidUniversityException';
  }
}
