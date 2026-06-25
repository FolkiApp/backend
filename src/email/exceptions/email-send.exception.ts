import { InternalServerErrorException } from '@nestjs/common';

export class EmailSendException extends InternalServerErrorException {
  public readonly code = 'EMAIL_SEND_ERROR';

  constructor(message = 'Erro ao enviar email', error?: unknown) {
    super(
      {
        title: 'Erro ao enviar email',
        message,
        code: 'EMAIL_SEND_ERROR',
      },
      { cause: error },
    );
    this.name = 'EmailSendException';
  }
}
