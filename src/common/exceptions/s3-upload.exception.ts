import { InternalServerErrorException } from '@nestjs/common';

export class S3UploadException extends InternalServerErrorException {
  public readonly code = 'S3_UPLOAD_ERROR';

  constructor(message = 'Erro ao fazer upload no S3', error?: unknown) {
    super(
      {
        title: 'Erro ao fazer upload no S3',
        message,
        code: 'S3_UPLOAD_ERROR',
      },
      { cause: error },
    );
    this.name = 'S3UploadException';
  }
}
