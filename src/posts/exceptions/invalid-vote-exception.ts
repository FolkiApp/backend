import { BadRequestException } from '@nestjs/common';

export class InvalidVoteException extends BadRequestException {
  public readonly code = 'INVALID_VOTE_EXCEPTION';

  constructor(message = 'Tipo de voto inválido', error?: unknown) {
    super(
      {
        title: 'Tipo de voto inválido',
        message,
        code: 'INVALID_VOTE_EXCEPTION',
      },
      { cause: error },
    );
    this.name = 'InvalidVoteException';
  }
}
