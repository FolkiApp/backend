import { InternalServerErrorException } from '@nestjs/common';

export class S3DeleteException extends InternalServerErrorException {
  public readonly code = 'S3_DELETE_ERROR';

  constructor(message = 'Erro ao deletar arquivo do S3', error?: unknown) {
    super(
      {
        title: 'Erro ao deletar arquivo do S3',
        message,
        code: 'S3_DELETE_ERROR',
      },
      { cause: error },
    );
    this.name = 'S3DeleteException';
  }
}
