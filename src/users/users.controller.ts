import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { AuthenticateUserService } from './services/authenticate-user.service';
import { UpdateMeService } from './services/update-me.service';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthDto } from './dto/auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CountUsersService } from './services/count-users.service';
import { FindUserSubjectsService } from './services/find-user-subjects.service';
import { UserSubjectDto } from './dto/user-subject.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserByIdService: FindUserByIdService,
    private readonly authenticateUserService: AuthenticateUserService,
    private readonly updateMeService: UpdateMeService,
    private readonly countUsersService: CountUsersService,
    private readonly findUserSubjectsService: FindUserSubjectsService,
  ) {}

  @Post('auth')
  @ApiOperation({
    summary: 'Autentica usuário via sistema da universidade',
    description:
      'Autentica usuário usando credenciais do JupiterWeb (USP) ou SIGAA (UFSCar)',
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
  me(@CurrentUser() authUser: AuthUser): UserResponseDto {
    const user = this.findUserByIdService.execute(authUser);
    return new UserResponseDto(
      user.id,
      user.email,
      user.name,
      user.instituteId,
      user.courseId,
      user.isAdmin,
      user.universityId,
      user.userVersion,
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
    );
  }

  @Get('count')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retorna a quantidade de usuários',
  })
  async count(): Promise<number> {
    return await this.countUsersService.execute();
  }

  @Get('me/subjects')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retorna as disciplinas do usuário autenticado',
  })
  async findMySubjects(
    @CurrentUser() authUser: AuthUser,
  ): Promise<UserSubjectDto[]> {
    return this.findUserSubjectsService.execute(authUser.id);
  }
}
