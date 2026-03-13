import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { AuthenticateUserService } from './services/authenticate-user.service';
import { UpdateMeService } from './services/update-me.service';
import { AddBadgeService } from './services/add-badge.service';
import { UserResponseDto } from './dto/user-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { AuthDto } from './dto/auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddBadgeDto } from './dto/add-badge.dto';

import { FindUserSubjectsService } from './services/find-user-subjects.service';
import { UserSubjectDto } from './dto/user-subject.dto';
import { UserSubjectsResponseDto } from './dto/user-subjects-response.dto';
import { CoolNumbersDto } from './dto/cool-numbers.dto';
import { CoolNumbersService } from './services/cool-numbers.service';
import { SubjectClass } from '../subjects/entities/subject-class.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserByIdService: FindUserByIdService,
    private readonly authenticateUserService: AuthenticateUserService,
    private readonly updateMeService: UpdateMeService,
    private readonly coolNumbersService: CoolNumbersService,
    private readonly findUserSubjectsService: FindUserSubjectsService,
    private readonly addBadgeService: AddBadgeService,
  ) {}

  @Post('auth')
  @ApiOperation({
    summary: 'Autentica usuário via sistema da universidade',
    description:
      'Autentica usuário usando credenciais do JupiterWeb (USP) ou SIGAA (UFSCar) ou EDAC (Unicamp)',
  })
  async authenticate(@Body() authDto: AuthDto): Promise<AuthResponseDto> {
    return await this.authenticateUserService.execute(authDto);
  }

  @Get('me')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retorna dados do usuário autenticado',
  })
  me(@CurrentUser() authUser: AuthUser): MeResponseDto {
    const user = this.findUserByIdService.execute(authUser);
    return new MeResponseDto(
      new UserResponseDto(
        user.id,
        user.email,
        user.name,
        user.instituteId,
        user.courseId,
        user.isAdmin,
        user.universityId,
        user.userVersion,
        authUser.institute,
        authUser.university,
        user.badge,
      ),
    );
  }

  @Patch('me')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza dados do usuário autenticado',
    description:
      'Atualiza informações do perfil do usuário. Campos protegidos são automaticamente ignorados. Pode incluir notificationId para registrar dispositivo.',
  })
  async updateMe(
    @CurrentUser() authUser: AuthUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateMeService.execute(authUser.id, updateUserDto);
    return new UserResponseDto(
      user.id,
      user.email,
      user.name,
      user.instituteId,
      user.courseId,
      user.isAdmin,
      user.universityId,
      user.userVersion,
      authUser.institute,
      authUser.university,
      user.badge,
    );
  }

  @Get('cool-numbers')
  @ApiOperation({
    summary: 'Retorna a quantidade de usuários',
  })
  async count(): Promise<CoolNumbersDto> {
    return await this.coolNumbersService.execute();
  }

  @Patch('me/badge')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza o badge do usuário autenticado',
    description:
      'Define ou remove o badge do usuário. Envie null para remover.',
  })
  async updateBadge(
    @CurrentUser() authUser: AuthUser,
    @Body() addBadgeDto: AddBadgeDto,
  ): Promise<void> {
    await this.addBadgeService.execute(authUser, addBadgeDto.badge ?? null);
  }

  @Get('me/subjects')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retorna as disciplinas do usuário autenticado',
  })
  async findMySubjects(
    @CurrentUser() authUser: AuthUser,
  ): Promise<UserSubjectsResponseDto> {
    const userSubjects = await this.findUserSubjectsService.execute(
      authUser.id,
      authUser.universityId!,
    );

    return new UserSubjectsResponseDto(
      userSubjects.map(
        (us) =>
          new UserSubjectDto(
            us.subjectClass as unknown as SubjectClass,
            us.id,
            us.absences,
            us.grading,
          ),
      ),
    );
  }
}
