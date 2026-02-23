import { BadRequestException } from '@nestjs/common';

export class MaliciousFileException extends BadRequestException {
  public readonly code = 'MALICIOUS_FILE_DETECTED';

  constructor(error?: unknown) {
    super(
      {
        title: 'Arquivo malicioso',
        message: 'O arquivo não corresponde ao tipo declarado',
        code: 'MALICIOUS_FILE_DETECTED',
      },
      { cause: error },
    );
    this.name = 'MaliciousFileException';
  }
}
