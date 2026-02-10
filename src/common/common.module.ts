import { Module, Global } from '@nestjs/common';
import { CustomLogger } from './logger/custom-logger.service';
import { CorrelationIdService } from './services/correlation-id.service';

@Global()
@Module({
  providers: [CustomLogger, CorrelationIdService],
  exports: [CustomLogger, CorrelationIdService],
})
export class CommonModule {}
