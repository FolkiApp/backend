import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const responseBody: any = {
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    };

    // Se a exception tiver um código customizado, adiciona na resposta
    if ('code' in exception) {
      responseBody.code = (exception as any).code;
    }

    // Se a resposta original for um objeto, mescla com o response body
    if (typeof exceptionResponse === 'object') {
      Object.assign(responseBody, exceptionResponse);
    }

    response.status(status).json(responseBody);
  }
}
