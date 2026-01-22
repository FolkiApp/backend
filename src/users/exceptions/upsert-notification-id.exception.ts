import { InternalServerErrorException } from '@nestjs/common';

export class UpsertNotificationIdException extends InternalServerErrorException {
  public readonly code = 'UPSERT_NOTIFICATION_ID_EXCEPTION';

  constructor(message = 'Erro ao salvar ID de notificação', error?: unknown) {
    super(
      {
        title: 'UpsertNotificationIdException',
        message,
        code: 'UPSERT_NOTIFICATION_ID_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'UpsertNotificationIdException';
  }
}
