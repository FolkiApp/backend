import { Get, Controller, Post, Body, Delete, Param } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { FindAllImportantDateService } from './services/find-all-important-date.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { ImportantDateResponseDto } from './dtos/important-date.dto';
import { CreateImportantDateService } from './services/create-important-date.service';
import { CreateImportantDateDto } from './dtos/create-important-date.dto';
import { ApiKey } from '../common/decorators/api-key.decorator';
import { DeleteImportantDateService } from './services/delete-important-date.service';

@Controller('important-dates')
export class ImportantDateController {
  constructor(
    private findAllImportantDateService: FindAllImportantDateService,
    private createImportantDateService: CreateImportantDateService,
    private deleteImportantDateService: DeleteImportantDateService,
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
  @ApiKey()
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Cria uma nova data importante',
    description: 'Cria uma nova data importante para a universidade ou campus',
  })
  async create(
    @Body() data: CreateImportantDateDto,
  ): Promise<ImportantDateResponseDto> {
    {
      const importantDate = await this.createImportantDateService.execute(data);
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

  @Delete('/:id')
  @ApiKey()
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Deleta uma data importante',
    description: 'Deleta uma data importante pelo seu ID',
  })
  async delete(@Param('id') id: number): Promise<void> {
    await this.deleteImportantDateService.execute(id);
  }
}
