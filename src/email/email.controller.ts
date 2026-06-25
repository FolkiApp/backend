import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { ApiKey } from '../common/decorators/api-key.decorator';
import { EmailService } from './services/email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { CustomLogger } from '../common/logger/custom-logger.service';
import { UserRepository } from '../users/repositories/user.repository';

@ApiTags('email')
@ApiSecurity('api-key')
@Controller('email')
export class EmailController {
  private readonly logger: CustomLogger;

  constructor(
    private readonly emailService: EmailService,
    private readonly userRepository: UserRepository,
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
    const { userIds, ...emailContent } = dto;

    const to = await this.userRepository.findEmailsByIds(userIds);

    this.logger.log({
      message: 'Sending email',
      requestedUsersCount: userIds.length,
      recipientsCount: to.length,
      subject: dto.subject,
    });

    await this.emailService.sendEmail({ ...emailContent, to });
  }
}
