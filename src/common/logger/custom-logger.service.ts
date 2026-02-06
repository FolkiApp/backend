import {
  Injectable,
  LoggerService as NestLoggerService,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { CorrelationIdService } from '../services/correlation-id.service';

@Injectable()
export class CustomLogger implements NestLoggerService {
  private context?: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly correlationIdService: CorrelationIdService,
  ) {}

  setContext(context: string) {
    this.context = context;
  }

  private formatMessage(message: any): Record<string, any> {
    const correlationId = this.correlationIdService.getCorrelationId();

    if (typeof message === 'object' && message !== null) {
      return {
        ...(message as Record<string, any>),
        context: this.context,
        correlationId,
      };
    }

    return {
      message: String(message),
      context: this.context,
      correlationId,
    };
  }

  log(message: any) {
    this.logger.info(this.formatMessage(message));
  }

  error(message: any, trace?: string) {
    const formattedMessage: Record<string, any> = this.formatMessage(message);
    if (trace) {
      this.logger.error({ ...formattedMessage, trace });
    } else {
      this.logger.error(formattedMessage);
    }
  }

  warn(message: any) {
    this.logger.warn(this.formatMessage(message));
  }

  debug(message: any) {
    this.logger.debug(this.formatMessage(message));
  }

  verbose(message: any) {
    this.logger.verbose(this.formatMessage(message));
  }
}
