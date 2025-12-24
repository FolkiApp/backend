import { BadRequestException } from '@nestjs/common';

export class UniversitySystemTimeoutException extends BadRequestException {
  public readonly code = 'UNIVERSITY_SYSTEM_TIMEOUT';

  constructor() {
    super(
      'Erro de comunicação com o sistema da universidade - Tente novamente mais tarde',
    );
    this.name = 'UniversitySystemTimeoutException';
  }
}
