import { Injectable, Logger } from '@nestjs/common';
import { CoolNumbersEntity } from '../entities/cool-numbers.entity';
import { UserRepository } from '../repositories/user.repository';
import { UsersCountException } from '../exceptions/users-count.exception';

@Injectable()
export class CoolNumbersService {
  private readonly logger = new Logger(CoolNumbersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<CoolNumbersEntity> {
    this.logger.log({ message: 'Executing count users' });
    return this.count();
  }

  private async count(): Promise<CoolNumbersEntity> {
    try {
      const userCount = await this.userRepository.count();

      this.logger.log({
        message: 'Users counted successfully',
        userCount,
      });

      return new CoolNumbersEntity(userCount);
    } catch (error: unknown) {
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error({ message: 'Error counting users' }, stack);

      throw new UsersCountException('Failed to count users', error);
    }
  }
}
