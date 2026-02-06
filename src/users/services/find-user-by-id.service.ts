import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { AuthUser } from 'src/common/guards/auth.guard';

@Injectable()
export class FindUserByIdService {
  private readonly logger: CustomLogger;

  constructor(logger: CustomLogger) {
    this.logger = logger;
    this.logger.setContext(FindUserByIdService.name);
  }

  execute(user: AuthUser): User {
    this.logger.log({
      message: 'Finding user by id',
      userId: user.id,
      email: user.email,
      universityId: user.universityId,
    });
    return new User(user);
  }
}
