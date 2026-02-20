import { Module, Global } from '@nestjs/common';
import { CustomLogger } from './logger/custom-logger.service';
import { CorrelationIdService } from './services/correlation-id.service';
import { S3Service } from './services/s3.service';

@Global()
@Module({
  providers: [CustomLogger, CorrelationIdService, S3Service],
  exports: [CustomLogger, CorrelationIdService, S3Service],
})
export class CommonModule {}
