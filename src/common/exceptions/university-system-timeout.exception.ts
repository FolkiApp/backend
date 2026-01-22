import { BadRequestException } from '@nestjs/common';

export class UniversitySystemTimeoutException extends BadRequestException {
  public readonly code = 'UNIVERSITY_SYSTEM_TIMEOUT';

  constructor(
    message = 'Erro de comunicação com o sistema da universidade - Tente novamente mais tarde',
    error?: unknown,
  ) {
    super(
      {
        title: 'UniversitySystemTimeoutException',
        message,
        code: 'UNIVERSITY_SYSTEM_TIMEOUT',
      },
      { cause: error },
    );
    this.name = 'UniversitySystemTimeoutException';
  }
}
