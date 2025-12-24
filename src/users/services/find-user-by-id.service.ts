import { Injectable, Logger } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { AuthUser } from 'src/common/guards/auth.guard';

@Injectable()
export class FindUserByIdService {
  private readonly logger = new Logger(FindUserByIdService.name);

  constructor() {}

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
