import { Get, Controller } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FindAllImportantDateService } from './services/find-all-important-date.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { ImportantDateResponseDto } from './dtos/important-date.dto';

@Controller('important-dates')
export class ImportantDateController {
  constructor(
    private findAllImportantDateService: FindAllImportantDateService,
  ) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Lista de datas importantes do usuário (feriados, eventos acadêmicos)',
    description:
      'Retorna todas as datas importantes do usuário, como feriados e eventos acadêmicos',
  })
  async findAll(
    @CurrentUser() authUser: AuthUser,
  ): Promise<ImportantDateResponseDto[]> {
    {
      const importantDates =
        await this.findAllImportantDateService.execute(authUser);
      return importantDates.map(
        (date) =>
          new ImportantDateResponseDto(
            date.id,
            date.name,
            date.date,
            date.type,
            date.shouldNotify,
            date.campusId,
            date.universityId,
          ),
      );
    }
  }
}
