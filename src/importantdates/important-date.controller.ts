import { Get, Controller, Post, Body } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FindAllImportantDateService } from './services/find-all-important-date.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { ImportantDateResponseDto } from './dtos/important-date.dto';
import { ImportantDate } from './entities/important-date.entity';
import { CreateImportantDateService } from './services/create-important-date.service';

@Controller('important-dates')
export class ImportantDateController {
  constructor(
    private findAllImportantDateService: FindAllImportantDateService,
    private createImportantDateService: CreateImportantDateService,
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

  @Post()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria uma nova data importante',
    description: 'Cria uma nova data importante para a universidade ou campus',
  })
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() data: Omit<ImportantDate, 'id'>,
  ): Promise<ImportantDateResponseDto> {
    {
      const importantDate = await this.createImportantDateService.execute(
        data,
        authUser,
      );
      return new ImportantDateResponseDto(
        importantDate.id,
        importantDate.name,
        importantDate.date,
        importantDate.type,
        importantDate.shouldNotify,
        importantDate.campusId,
        importantDate.universityId,
      );
    }
  }
}
