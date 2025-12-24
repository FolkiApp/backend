import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import type { AuthUser } from '../guards/auth.guard';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const { method, url, user } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          this.logger.log({
            message: 'HTTP request completed',
            method,
            url,
            userId: user?.id,
            responseTime,
            status: 'success',
          });
        },
        error: (error: Error) => {
          const responseTime = Date.now() - now;
          this.logger.error({
            message: 'HTTP request failed',
            method,
            url,
            userId: user?.id,
            responseTime,
            status: 'error',
            errorMessage: error.message,
          });
        },
      }),
    );
  }
}
