import { InternalServerErrorException } from '@nestjs/common';

export class UploadImageErrorException extends InternalServerErrorException {
  public readonly code = 'UPLOAD_IMAGE_ERROR_EXCEPTION';

  constructor(message = 'Erro ao fazer upload da imagem', error?: unknown) {
    super(
      {
        title: 'Erro ao fazer upload das imagens',
        message,
        code: 'UPLOAD_IMAGE_ERROR_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'UploadImageErrorException';
  }
}
