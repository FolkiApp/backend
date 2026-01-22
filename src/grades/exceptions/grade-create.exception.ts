import { HttpException, HttpStatus } from '@nestjs/common';

export class GradeCreateException extends HttpException {
  public readonly code = 'GRADE_CREATE_ERROR';

  constructor(
    message = 'Erro inesperado ao criar nota - Tente novamente mais tarde',
  ) {
    super(
      {
        title: 'GradeCreateException',
        message,
        code: 'GRADE_CREATE_ERROR',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.name = 'GradeCreateException';
  }
}
