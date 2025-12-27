import { Get, Controller, Param } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { AbsenceBySubjectService } from './services/find-absence-by-subject.service';
import { AbsenceDto } from './dto/absence.dto';

@Controller()
export class AbsenceController {
  constructor(private absenceService: AbsenceBySubjectService) {}

  @Get('subjects/:subjectId/absences')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar faltas da disciplina',
    description: 'Retorna todas as faltas vinculadas à disciplina',
  })
  async findAllBySubject(
    @Param('subjectId') subjectId: number,
    @CurrentUser() authUser: AuthUser,
  ): Promise<AbsenceDto[]> {
    return this.absenceService.execute(authUser, subjectId);
  }
}
