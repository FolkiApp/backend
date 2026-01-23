import { BadRequestException } from '@nestjs/common';

export class ActivityAlreadyExistsException extends BadRequestException {
  public readonly code = 'ACTIVITY_ALREADY_EXISTS';

  constructor(
    message = 'Atividade já existente - Verifique se a atividade já foi adicionada',
    error?: unknown,
  ) {
    super(
      {
        title: 'Atividade já existe',
        message,
        code: 'ACTIVITY_ALREADY_EXISTS',
      },
      { cause: error },
    );
    this.name = 'ActivityAlreadyExistsException';
  }
}
