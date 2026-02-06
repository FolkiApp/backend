import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

interface LogMetadata {
  timestamp?: string;
  level?: string;
  message?: string;
  context?: string;
  correlationId?: string;
  [key: string]: unknown;
}

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        isProduction
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf((info) => {
                const {
                  timestamp,
                  level,
                  message,
                  context,
                  correlationId,
                  ...metadata
                } = info as LogMetadata;
                let msg = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
                if (correlationId) {
                  msg += ` [${correlationId}]`;
                }
                const metadataKeys = Object.keys(metadata);
                if (metadataKeys.length > 0) {
                  msg += ` ${JSON.stringify(metadata)}`;
                }
                return msg;
              }),
            ),
      ),
    }),
  ],
};
