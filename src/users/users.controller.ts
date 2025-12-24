import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guard';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { AuthenticateUserService } from './services/authenticate-user.service';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthDto } from './dto/auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserByIdService: FindUserByIdService,
    private readonly authenticateUserService: AuthenticateUserService,
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
}
