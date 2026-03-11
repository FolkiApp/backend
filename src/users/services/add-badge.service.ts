import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { UserRepository } from '../repositories/user.repository';
import { AuthUser } from 'src/common/guards/auth.guard';
import { AddBadgeException } from '../exceptions/add-badge.exception';

@Injectable()
export class AddBadgeService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly userRepository: UserRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(AddBadgeService.name);
  }

  async execute(user: AuthUser, badge: string | null): Promise<void> {
    this.logger.log({ message: 'Adding badge' });
    return this.addBadge(user.id, badge);
  }

  private async addBadge(userId: number, badge: string | null): Promise<void> {
    try {
      await this.userRepository.addBadge(userId, badge);

      this.logger.log({
        message: 'Badge added successfully',
        badge,
      });
    } catch (error: unknown) {
      this.logger.error({ message: 'Error adding badge', error });

      throw new AddBadgeException();
    }
  }
}
