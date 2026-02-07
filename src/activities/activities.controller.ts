import {
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Controller,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { GetAllActivitiesService } from './services/get-all-activities.service';
import { CreateActivityService } from './services/create-activity.service';
import { UpdateActivityService } from './services/update-activity.service';
import { DeleteActivityService } from './services/delete-activity.service';
import { CheckActivityService } from './services/check-activity.service';
import { UncheckActivityService } from './services/uncheck-activity.service';
import { IgnoreActivityService } from './services/ignore-activity.service';
import { UnignoreActivityService } from './services/unignore-activity.service';
import { ActivitiesResponseDto } from './dto/activities-response.dto';
import { CreateActivityResponseDto } from './dto/create-activity-response.dto';
import {
  ActivityResponseDto,
  SubjectClassDto,
  SubjectInfoDto,
  ActivityUserDto,
} from './dto/activity-response.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly getAllActivitiesService: GetAllActivitiesService,
    private readonly createActivityService: CreateActivityService,
    private readonly updateActivityService: UpdateActivityService,
    private readonly deleteActivityService: DeleteActivityService,
    private readonly checkActivityService: CheckActivityService,
    private readonly uncheckActivityService: UncheckActivityService,
    private readonly ignoreActivityService: IgnoreActivityService,
    private readonly unignoreActivityService: UnignoreActivityService,
  ) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar todas as atividades',
    description:
      'Retorna todas as atividades do usuário para o ano atual, ordenadas por data de entrega',
  })
  async findAll(
    @CurrentUser() authUser: AuthUser,
  ): Promise<ActivitiesResponseDto> {
    const activities = await this.getAllActivitiesService.execute(authUser);

    const activitiesDto = activities.map(
      (activity) =>
        new ActivityResponseDto(
          activity.id,
          activity.name,
          activity.description,
          activity.finishDate,
          activity.createdAt,
          activity.updatedAt,
          activity.deletedAt,
          activity.isPrivate,
          activity.userId,
          activity.subjectClassId,
          activity.type,
          activity.value ?? null,
          activity.checked || false,
          new SubjectClassDto(
            activity.subjectClass!.id,
            activity.subjectClass!.year,
            new SubjectInfoDto(
              activity.subjectClass!.subject!.id,
              activity.subjectClass!.subject!.name,
            ),
          ),
          new ActivityUserDto(activity.user!.name),
        ),
    );

    return new ActivitiesResponseDto(activitiesDto);
  }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar uma atividade',
    description:
      'Cria uma nova atividade para uma disciplina. Usuários bloqueados não podem criar atividades.',
  })
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() createActivityDto: CreateActivityDto,
  ): Promise<CreateActivityResponseDto> {
    const activity = await this.createActivityService.execute(
      authUser,
      createActivityDto,
    );

    return new CreateActivityResponseDto(
      new ActivityResponseDto(
        activity.id,
        activity.name,
        activity.description,
        activity.finishDate,
        activity.createdAt,
        activity.updatedAt,
        activity.deletedAt,
        activity.isPrivate,
        activity.userId,
        activity.subjectClassId,
        activity.checked || false,
        new SubjectClassDto(
          activity.subjectClass!.id,
          activity.subjectClass!.year,
          new SubjectInfoDto(
            activity.subjectClass!.subject!.id,
            activity.subjectClass!.subject!.name,
          ),
        ),
        new ActivityUserDto(activity.user!.name),
      ),
    );
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar uma atividade',
    description:
      'Atualiza os dados de uma atividade existente. Apenas usuários cadastrados na disciplina podem atualizar.',
  })
  async update(
    @CurrentUser() authUser: AuthUser,
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ): Promise<ActivityResponseDto> {
    const activity = await this.updateActivityService.execute(
      authUser,
      Number(id),
      updateActivityDto,
    );

    return new ActivityResponseDto(
      activity.id,
      activity.name,
      activity.description,
      activity.finishDate,
      activity.createdAt,
      activity.updatedAt,
      activity.deletedAt,
      activity.isPrivate,
      activity.userId,
      activity.subjectClassId,
      activity.checked || false,
      new SubjectClassDto(
        activity.subjectClass!.id,
        activity.subjectClass!.year,
        new SubjectInfoDto(
          activity.subjectClass!.subject!.id,
          activity.subjectClass!.subject!.name,
        ),
      ),
      new ActivityUserDto(activity.user!.name),
    );
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar uma atividade',
    description:
      'Deleta uma atividade (soft delete). Apenas o dono ou usuários cadastrados na disciplina (se não for privada) podem deletar.',
  })
  async delete(
    @CurrentUser() authUser: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteActivityService.execute(authUser, Number(id));
  }

  @Post(':id/check')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marcar atividade como concluída',
    description: 'Marca uma atividade como concluída para o usuário.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  async check(
    @CurrentUser() authUser: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.checkActivityService.execute(authUser, Number(id));
  }

  @Delete(':id/check')
  @Auth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desmarcar atividade como concluída',
    description:
      'Remove a marcação de conclusão de uma atividade para o usuário.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Atividade desmarcada com sucesso',
  })
  async uncheck(
    @CurrentUser() authUser: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.uncheckActivityService.execute(authUser, Number(id));
  }

  @Post(':id/ignore')
  @Auth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marcar atividade como ignorada',
    description: 'Marca uma atividade como ignorada para o usuário.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Atividade marcada como ignorada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Atividade não encontrada',
  })
  async ignore(
    @CurrentUser() authUser: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.ignoreActivityService.execute(authUser, Number(id));
  }

  @Delete(':id/ignore')
  @Auth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desmarcar atividade como ignorada',
    description:
      'Remove a marcação de ignorada de uma atividade para o usuário.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Atividade desmarcada como ignorada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Atividade não encontrada',
  })
  async unignore(
    @CurrentUser() authUser: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.unignoreActivityService.execute(authUser, Number(id));
  }
}
