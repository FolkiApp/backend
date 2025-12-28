import { InternalServerErrorException } from '@nestjs/common';

export class AbsenceBySubjectException extends InternalServerErrorException {
  public readonly code = 'ABSENCE_BY_SUBJECT_EXCEPTION';

  constructor(message = 'Erro ao buscar absences', error?: unknown) {
    super(message, { cause: error });
    this.name = 'AbsenceBySubjectException';
  }
}
