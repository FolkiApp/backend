import { BadRequestException } from '@nestjs/common';

export class ActivityUpdateNotificationException extends BadRequestException {
  public readonly code = 'ACTIVITY_UPDATE_NOTIFICATION_ERROR';

  constructor(
    message = 'Erro ao enviar notificação de atualização de atividade',
    error?: unknown,
  ) {
    super(
      {
        title: 'Erro ao enviar notificação de atualização de atividade',
        message,
        code: 'ACTIVITY_UPDATE_NOTIFICATION_ERROR',
      },
      { cause: error },
    );
    this.name = 'ActivityUpdateNotificationException';
  }
}
