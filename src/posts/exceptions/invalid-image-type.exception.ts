import { BadRequestException } from '@nestjs/common';

export class InvalidImageTypeException extends BadRequestException {
  public readonly code = 'INVALID_IMAGE_TYPE';

  constructor(error?: unknown) {
    super(
      {
        title: 'Tipo de arquivo inválido',
        message: 'Apenas imagens JPEG, PNG, GIF e WebP são permitidas',
        code: 'INVALID_IMAGE_TYPE',
      },
      { cause: error },
    );
    this.name = 'InvalidImageTypeException';
  }
}
