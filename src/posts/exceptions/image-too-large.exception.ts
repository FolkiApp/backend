import { BadRequestException } from '@nestjs/common';

export class ImageTooLargeException extends BadRequestException {
  public readonly code = 'IMAGE_TOO_LARGE';

  constructor(error?: unknown) {
    super(
      {
        title: 'Imagem muito grande',
        message: 'A imagem deve ter menos de 6MB',
        code: 'IMAGE_TOO_LARGE',
      },
      { cause: error },
    );
    this.name = 'ImageTooLargeException';
  }
}
