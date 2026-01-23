import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserSubjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdAndUserId(
    userSubjectId: number,
    userId: number,
  ): Promise<{ id: number } | null> {
    return await this.prisma.user_subject.findFirst({
      where: {
        id: userSubjectId,
        userId,
      },
      select: {
        id: true,
      },
    });
  }

  async getNotificationIdsBySubjectClassId(
    subjectClassId: number,
    excludeUserId?: number,
  ): Promise<string[]> {
    const userSubjects = await this.prisma.user_subject.findMany({
      where: {
        subjectClassId,
        userId: excludeUserId ? { not: excludeUserId } : undefined,
        deletedAt: null,
      },
      select: {
        user: {
          select: {
            user_notification_id: {
              select: {
                notificationId: true,
              },
            },
          },
        },
      },
    });

    const notificationIds = userSubjects
      .flatMap((us) => us.user.user_notification_id)
      .map((n) => n.notificationId);

    return notificationIds;
  }
}
