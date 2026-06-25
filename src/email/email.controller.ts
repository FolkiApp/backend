import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { ApiKey } from '../common/decorators/api-key.decorator';
import { EmailService } from './services/email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { CustomLogger } from '../common/logger/custom-logger.service';

@ApiTags('email')
@ApiSecurity('api-key')
@Controller('email')
export class EmailController {
  private readonly logger: CustomLogger;

  constructor(
    private readonly emailService: EmailService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(EmailController.name);
  }

  @Post()
  @ApiKey()
  @ApiOperation({ summary: 'Envia um email via AWS SES (uso administrativo).' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendEmail(@Body() dto: SendEmailDto): Promise<void> {
    this.logger.log({
      message: 'Sending email',
      recipientsCount: dto.to.length,
      subject: dto.subject,
    });

    await this.emailService.sendEmail(dto);
  }
}
