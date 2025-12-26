import { Get, Controller, Req, Res } from '@nestjs/common';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FindAllImportantDate } from './services/find-all-important-date.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/common/guards/auth.guard';
import { ImportantDateResponseDto } from './dtos/important-date.dto';

@Controller('/important-date')
export class ImportanteDateController {
  constructor(private findAllImportantDate: FindAllImportantDate) {}

  @Get('/')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get important dates for the authenticated user',
    description:
      "Retrieves a list of important dates based on the user's university and institute affiliation.",
  })
  async findAll(
    @CurrentUser() authUser: AuthUser,
  ): Promise<ImportantDateResponseDto[]> {
    {
      const importantDates = await this.findAllImportantDate.execute(authUser);
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
