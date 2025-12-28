import { Get, Controller, Param, Post, Body } from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { AbsenceBySubjectService } from './services/find-absence-by-subject.service';
import { AbsenceDto } from './dto/absence.dto';
import { PostAbsence } from './services/post-absence.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';

@Controller()
export class AbsenceController {
  constructor(
    private absenceService: AbsenceBySubjectService,
    private postAbsenceService: PostAbsence,
  ) {}

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
    const absences = await this.absenceService.execute(authUser, subjectId);

    return absences.map(
      (absence) =>
        new AbsenceDto(
          absence.id,
          absence.date,
          absence.createdAt,
          absence.userId,
          absence.userSubjectId,
        ),
    );
  }

  @Post('subjects/:subjectId/absences')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Adicionar uma falta para uma disciplina',
    description: 'Adiciona uma falta para a disciplina cadastrada',
  })
  async postAbsence(
    @Param('subjectId') subjectId: number,
    @Body() body: CreateAbsenceDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<AbsenceDto> {
    const absence = await this.postAbsenceService.execute(
      authUser,
      subjectId,
      new Date(body.date),
    );

    return new AbsenceDto(
      absence.id,
      absence.date,
      absence.createdAt,
      absence.userId,
      absence.userSubjectId,
    );
  }
}
