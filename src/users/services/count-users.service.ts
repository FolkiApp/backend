import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UsersCountException } from '../exceptions/users-count.exception';

@Injectable()
export class CountUsersService {
  private readonly logger = new Logger(CountUsersService.name);
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<number> {
    this.logger.log({ message: 'Executing count users' });
    return await this.count();
  }

  private async count(): Promise<number> {
    try {
      const userCount = await this.userRepository.count();
      this.logger.log({ message: 'Users counted successfully', userCount });
      return userCount;
    } catch (error) {
      this.logger.error({
        message: 'Error counting users',
        UsersCountException,
      });
      throw new UsersCountException('Failed to count users', error);
    }
  }
}
