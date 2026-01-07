import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Auth } from '../common/decorators/auth.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { GetAllGradesFromSubjectService } from './services/get-all-grades-from-subject.service';
import { CreateGradeService } from './services/create-grade.service';
import { DeleteGradeService } from './services/delete-grade.service';
import { GradesResponseDto, GradeDto } from './dto/grades-response.dto';
import { CreateGradeDto } from './dto/create-grade.dto';

@ApiTags('grades')
@Controller('subjects/:subjectId/grades')
export class GradesController {
  constructor(
    private readonly getAllGradesFromSubjectService: GetAllGradesFromSubjectService,
    private readonly createGradeService: CreateGradeService,
    private readonly deleteGradeService: DeleteGradeService,
  ) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar todas as notas de uma matéria',
    description: 'Retorna todas as notas associadas a uma matéria do usuário.',
  })
  @ApiParam({
    name: 'subjectId',
    description: 'ID da matéria do usuário (user_subject)',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de notas retornada com sucesso',
    type: GradesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Matéria não encontrada',
  })
  async findAll(
    @CurrentUser() authUser: AuthUser,
    @Param('subjectId') subjectId: string,
  ): Promise<GradesResponseDto> {
    const grades = await this.getAllGradesFromSubjectService.execute(
      authUser,
      Number(subjectId),
    );
    return { grades };
  }

  @Post()
  @Auth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar uma nota',
    description:
      'Cria uma nova nota para uma matéria. A nota é criada e o valor ponderado é adicionado à média da matéria.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Nota criada com sucesso',
    type: GradeDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Matéria não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  async create(
    @CurrentUser() authUser: AuthUser,
    @Body() createGradeDto: CreateGradeDto,
  ): Promise<GradeDto> {
    const grade = await this.createGradeService.execute(
      authUser,
      createGradeDto,
    );

    return {
      id: grade.id,
      name: grade.name,
      value: grade.value,
      userSubjectId: grade.userSubjectId,
      createdAt: grade.createdAt,
    };
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar uma nota',
    description:
      'Deleta uma nota e atualiza a média da matéria. Apenas o dono da matéria pode deletar.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da nota',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nota deletada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nota não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permissão negada',
  })
  async delete(
    @CurrentUser() authUser: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteGradeService.execute(authUser, Number(id));
  }
}
