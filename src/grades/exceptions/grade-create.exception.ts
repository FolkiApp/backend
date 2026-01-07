import { HttpException, HttpStatus } from '@nestjs/common';

export class GradeCreateException extends HttpException {
  constructor() {
    super(
      {
        title: 'Erro inesperado',
        message: 'Erro inesperado ao criar nota - Tente novamente mais tarde',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
