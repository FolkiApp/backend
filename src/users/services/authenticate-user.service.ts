import { Injectable } from '@nestjs/common';
import { InvalidUniversityException } from '../../common/exceptions/invalid-university.exception';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { InvalidCredentialsException } from '../../common/exceptions/invalid-credentials.exception';
import { UniversitySystemTimeoutException } from '../../common/exceptions/university-system-timeout.exception';
import { AuthenticationException } from '../../common/exceptions/authentication.exception';
import { createToken } from '../../common/utils/create-token';
import { AuthDto } from '../dto/auth.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { ScrapJupiterService } from './scrap-jupiter.service';
import { AccessUFSCarSigaaService } from './access-ufscar-sigaa.service';

const VALID_UNIVERSITY_IDS = [1, 2];

@Injectable()
export class AuthenticateUserService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly scrapJupiterService: ScrapJupiterService,
    private readonly accessUFSCarSigaaService: AccessUFSCarSigaaService,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(AuthenticateUserService.name);
  }

  async execute(authDto: AuthDto): Promise<AuthResponseDto> {
    const { uspCode, password, universityId = 1 } = authDto;

    if (!VALID_UNIVERSITY_IDS.includes(universityId)) {
      throw new InvalidUniversityException();
    }

    try {
      this.logger.log({
        message: 'Starting authentication',
        universityId,
        uspCode,
      });

      const user =
        universityId === 1
          ? await this.scrapJupiterService.execute(uspCode, password)
          : await this.accessUFSCarSigaaService.execute(uspCode, password);

      const token = createToken(user.id, user.securePin!);

      const userResponse = new UserResponseDto(
        user.id,
        user.email,
        user.name,
        user.instituteId,
        user.courseId,
        user.isAdmin,
        user.universityId,
        user.userVersion,
      );

      this.logger.log({
        message: 'User authenticated',
        userId: user.id,
        email: user.email,
        universityId: user.universityId,
        courseId: user.courseId,
        instituteId: user.instituteId,
      });

      return new AuthResponseDto(token, userResponse);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Invalid credentials
        if (
          error.message.includes(
            "Waiting for selector `a[href='gradeHoraria?codmnu=4759']` failed",
          ) ||
          error.message === 'Invalid credentials'
        ) {
          this.logger.warn({
            message: 'Login attempt with invalid credentials',
            uspCode,
            universityId,
          });
          throw new InvalidCredentialsException();
        }

        // Timeout
        if (
          error.message.includes('Waiting failed: 30000ms exceeded') ||
          error.message.includes('Navigation timeout')
        ) {
          this.logger.error({
            message: 'Timeout accessing university system',
            universityId,
            uspCode,
            errorMessage: error.message,
          });
          throw new UniversitySystemTimeoutException();
        }

        this.logger.error({
          message: 'Unexpected error during authentication',
          universityId,
          uspCode,
          errorMessage: error.message,
          stack: error.stack,
        });
        throw new AuthenticationException();
      }

      throw new AuthenticationException();
    }
  }
}
