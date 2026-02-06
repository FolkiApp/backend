import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import type { AuthUser } from '../guards/auth.guard';
import { CustomLogger } from '../logger/custom-logger.service';
import { CorrelationIdService } from '../services/correlation-id.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: CustomLogger;

  constructor(
    @Inject(CustomLogger) logger: CustomLogger,
    private readonly correlationIdService: CorrelationIdService,
  ) {
    this.logger = logger;
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const { method, url, user, headers } = request;
    const correlationId = this.correlationIdService.getCorrelationId();
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
            userEmail: user?.email,
            responseTime,
            status: 'success',
            timestamp: new Date().toISOString(),
          });
        },
        error: (error: Error) => {
          const responseTime = Date.now() - now;
          this.logger.error({
            message: 'HTTP request failed',
            method,
            url,
            userId: user?.id,
            userEmail: user?.email,
            responseTime,
            status: 'error',
            errorName: error.name,
            errorMessage: error.message,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
