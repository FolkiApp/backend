import { BadRequestException } from '@nestjs/common';

export class InvalidUniversityException extends BadRequestException {
  public readonly code = 'INVALID_UNIVERSITY';

  constructor(message = 'Universidade não encontrada', error?: unknown) {
    super(
      {
        title: 'InvalidUniversityException',
        message,
        code: 'INVALID_UNIVERSITY',
      },
      { cause: error },
    );
    this.name = 'InvalidUniversityException';
  }
}
