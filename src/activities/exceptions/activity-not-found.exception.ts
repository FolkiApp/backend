import { NotFoundException } from '@nestjs/common';

export class ActivityNotFoundException extends NotFoundException {
  public readonly code = 'ACTIVITY_NOT_FOUND';

  constructor(message = 'Atividade não encontrada', error?: unknown) {
    super(message, { cause: error });
    this.name = 'ActivityNotFoundException';
  }
}
