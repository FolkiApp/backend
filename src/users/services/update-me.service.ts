import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserNotificationIdRepository } from '../repositories/user-notification-id.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { UserUpdateException } from '../exceptions/user-update.exception';

@Injectable()
export class UpdateMeService {
  private readonly logger = new Logger(UpdateMeService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userNotificationIdRepository: UserNotificationIdRepository,
  ) {}

  async execute(userId: number, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log({
      message: 'Starting user update',
      userId,
    });

    await this.handleNotificationId(userId, updateUserDto.notificationId);
    const updatedUser = await this.updateUserInfo(userId, updateUserDto);

    this.logger.log({
      message: 'User updated successfully',
      userId,
    });

    return updatedUser;
  }

  private async updateUserInfo(userId: number, updateUserDto: UpdateUserDto) {
    try {
      return await this.userRepository.update(userId, updateUserDto);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error updating user info',
        userId,
        error: error instanceof Error ? error.message : error,
      });

      throw new UserUpdateException();
    }
  }

  private async handleNotificationId(
    userId: number,
    notificationId?: string,
  ): Promise<void> {
    if (!notificationId) return;

    try {
      await this.userNotificationIdRepository.upsert(userId, notificationId);

      this.logger.log({
        message: 'Notification ID updated',
        userId,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error updating notification ID',
        userId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
