import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { UserNotificationIdRepository } from '../repositories/user-notification-id.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserData } from '../repositories/dto/update-user-data.dto';
import { User } from '../entities/user.entity';
import { UserUpdateException } from '../exceptions/user-update.exception';

@Injectable()
export class UpdateMeService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userNotificationIdRepository: UserNotificationIdRepository,
    logger: CustomLogger,
  ) {
    this.logger = logger;
    this.logger.setContext(UpdateMeService.name);
  }

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
      const updateData = new UpdateUserData(
        updateUserDto.name,
        updateUserDto.instituteId,
        updateUserDto.courseId,
        updateUserDto.universityId,
        updateUserDto.userVersion,
      );

      return await this.userRepository.update(userId, updateData);
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

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(notificationId)) {
      this.logger.warn({
        message: 'Invalid notification ID format - not a UUID',
        userId,
        notificationId,
      });
      return;
    }

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
