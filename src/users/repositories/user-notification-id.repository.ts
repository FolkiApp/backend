import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserNotificationId } from '../entities/user-notification-id.entity';

@Injectable()
export class UserNotificationIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserIdAndNotificationId(
    userId: number,
    notificationId: string,
  ): Promise<UserNotificationId | null> {
    const record = await this.prisma.user_notification_id.findUnique({
      where: {
        userId_notificationId: {
          userId,
          notificationId,
        },
      },
    });

    if (!record) {
      return null;
    }

    return new UserNotificationId(record);
  }

  async upsert(
    userId: number,
    notificationId: string,
  ): Promise<UserNotificationId> {
    const record = await this.prisma.user_notification_id.upsert({
      where: {
        userId_notificationId: {
          userId,
          notificationId,
        },
      },
      update: {
        lastUpdated: new Date(),
      },
      create: {
        userId,
        notificationId,
      },
    });

    return new UserNotificationId(record);
  }

  async findAllByUserId(userId: number): Promise<UserNotificationId[]> {
    const records = await this.prisma.user_notification_id.findMany({
      where: { userId },
      orderBy: { lastUpdated: 'desc' },
    });

    return records.map((record) => new UserNotificationId(record));
  }
}
