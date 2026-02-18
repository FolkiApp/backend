import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { CustomLogger } from '../../common/logger/custom-logger.service';

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate?: boolean;
    'hate/threatening'?: boolean;
    harassment?: boolean;
    'harassment/threatening'?: boolean;
    'self-harm'?: boolean;
    'self-harm/intent'?: boolean;
    'self-harm/instructions'?: boolean;
    sexual?: boolean;
    'sexual/minors'?: boolean;
    violence?: boolean;
    'violence/graphic'?: boolean;
  };
}

@Injectable()
export class ModerationService {
  private readonly logger: CustomLogger;
  private openai: OpenAI | null = null;

  constructor(logger: CustomLogger) {
    this.logger = logger;
    this.logger.setContext(ModerationService.name);
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI moderation service initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not found, moderation disabled');
    }
  }

  async moderateContent(content: string): Promise<ModerationResult> {
    if (!this.openai) {
      this.logger.warn('Moderation skipped - OpenAI not configured');
      return { flagged: false, categories: {} };
    }

    try {
      this.logger.log({
        message: 'Moderating content',
        contentLength: content.length,
      });

      const moderation = await this.openai.moderations.create({
        input: content,
        model: 'omni-moderation-latest',
      });

      const result = moderation.results[0];

      this.logger.log({
        message: 'Moderation complete',
        flagged: result.flagged,
        categories: result.categories,
      });

      return {
        flagged: result.flagged,
        categories: result.categories,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error during content moderation',
        error: error instanceof Error ? error.message : String(error),
      });

      return { flagged: false, categories: {} };
    }
  }
}
