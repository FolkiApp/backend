import { InternalServerErrorException } from '@nestjs/common';

export class ImportantDateFetchException extends InternalServerErrorException {
  public readonly code = 'IMPORTANT_DATE_FETCH_EXCEPTION';

  constructor(message = 'Erro ao buscar datas importantes', error?: unknown) {
    super(message, { cause: error });
    this.name = 'ImportantDateFetchException';
  }
}
