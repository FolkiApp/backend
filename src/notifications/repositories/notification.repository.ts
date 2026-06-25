import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(
    title: string,
    message: string,
    userIds: number[],
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        title,
        message,
        users: {
          create: userIds.map((userId) => ({
            userId,
          })),
        },
      },
    });
  }
}
