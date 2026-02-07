import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Activity,
  ActivitySubjectClass,
  ActivitySubjectInfo,
  ActivityUser,
} from '../entities/activity.entity';
import { ActivityType } from '../dto/create-activity.dto';
import { UpdateActivityData } from './dto/update-activity-data.dto';
import { UserActivityCheck } from '../entities/user-activity-check.entity';

@Injectable()
export class ActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(
    userId: number,
    currentYear: number,
  ): Promise<Activity[]> {
    const activities = await this.prisma.activity.findMany({
      where: {
        OR: [
          {
            subjectClass: {
              user_subject: { some: { userId } },
              year: currentYear,
            },
            isPrivate: false,
          },
          {
            subjectClass: {
              user_subject: { some: { userId } },
              year: currentYear,
            },
            userId,
          },
        ],
      },
      orderBy: { finishDate: 'asc' },
      include: {
        subjectClass: {
          include: {
            subject: {
              select: { id: true, name: true },
            },
          },
        },
        user: {
          select: { name: true },
        },
        user_activity_check: {
          where: { userId },
        },
        user_activity_ignore: {
          where: { userId },
        },
      },
    });

    return activities.map(
      (activity) =>
        new Activity(
          activity.id,
          activity.name,
          activity.description,
          activity.finishDate,
          activity.createdAt,
          activity.updatedAt,
          activity.deletedAt,
          activity.isPrivate,
          activity.userId,
          activity.subjectClassId,
          activity.value,
          activity.user_activity_check.length > 0,
          new ActivitySubjectClass(
            activity.subjectClass.id,
            activity.subjectClass.year,
            new ActivitySubjectInfo(
              activity.subjectClass.subject.id,
              activity.subjectClass.subject.name,
            ),
          ),
          new ActivityUser(activity.user.name),
          activity.user_activity_ignore.length > 0,
        ),
    );
  }

  async findActivityByTypeAndDate(
    subjectClassId: number,
    type: ActivityType,
    finishDate: Date,
  ): Promise<Activity | null> {
    const activity = await this.prisma.activity.findFirst({
      where: {
        subjectClassId,
        type,
        finishDate,
        isPrivate: false,
      },
    });

    if (!activity) return null;

    return new Activity(
      activity.id,
      activity.name,
      activity.description,
      activity.finishDate,
      activity.createdAt,
      activity.updatedAt,
      activity.deletedAt,
      activity.isPrivate,
      activity.userId,
      activity.subjectClassId,
      activity.value,
    );
  }

  async createActivity(
    userId: number,
    name: string,
    description: string,
    value: number | null | undefined,
    subjectClassId: number,
    type: ActivityType,
    finishDate: Date,
    isPrivate: boolean,
  ): Promise<Activity> {
    const activity = await this.prisma.activity.create({
      data: {
        name,
        description,
        value,
        subjectClassId,
        type,
        finishDate,
        isPrivate,
        userId,
      },
      include: {
        subjectClass: {
          include: {
            subject: {
              select: { id: true, name: true },
            },
          },
        },
        user: {
          select: { name: true },
        },
      },
    });

    return new Activity(
      activity.id,
      activity.name,
      activity.description,
      activity.finishDate,
      activity.createdAt,
      activity.updatedAt,
      activity.deletedAt,
      activity.isPrivate,
      activity.userId,
      activity.subjectClassId,
      activity.value,
      false,
      new ActivitySubjectClass(
        activity.subjectClass.id,
        activity.subjectClass.year,
        new ActivitySubjectInfo(
          activity.subjectClass.subject.id,
          activity.subjectClass.subject.name,
        ),
      ),
      new ActivityUser(activity.user.name),
      false,
    );
  }

  async findById(activityId: number): Promise<Activity | null> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        subjectClass: {
          include: {
            subject: {
              select: { id: true, name: true },
            },
          },
        },
        user: {
          select: { name: true },
        },
      },
    });

    if (!activity) return null;

    return new Activity(
      activity.id,
      activity.name,
      activity.description,
      activity.finishDate,
      activity.createdAt,
      activity.updatedAt,
      activity.deletedAt,
      activity.isPrivate,
      activity.userId,
      activity.subjectClassId,
      activity.value,
      false,
      new ActivitySubjectClass(
        activity.subjectClass.id,
        activity.subjectClass.year,
        new ActivitySubjectInfo(
          activity.subjectClass.subject.id,
          activity.subjectClass.subject.name,
        ),
      ),
      new ActivityUser(activity.user.name),
      false,
    );
  }

  async update(
    activityId: number,
    updateData: UpdateActivityData,
  ): Promise<Activity> {
    const activity = await this.prisma.activity.update({
      where: { id: activityId },
      data: updateData,
      include: {
        subjectClass: {
          include: {
            subject: {
              select: { id: true, name: true },
            },
          },
        },
        user: {
          select: { name: true },
        },
      },
    });

    return new Activity(
      activity.id,
      activity.name,
      activity.description,
      activity.finishDate,
      activity.createdAt,
      activity.updatedAt,
      activity.deletedAt,
      activity.isPrivate,
      activity.userId,
      activity.subjectClassId,
      activity.value,
      false,
      new ActivitySubjectClass(
        activity.subjectClass.id,
        activity.subjectClass.year,
        new ActivitySubjectInfo(
          activity.subjectClass.subject.id,
          activity.subjectClass.subject.name,
        ),
      ),
      new ActivityUser(activity.user.name),
      false,
    );
  }

  async softDelete(activityId: number): Promise<void> {
    await this.prisma.activity.update({
      where: { id: activityId },
      data: { deletedAt: new Date() },
    });
  }

  async createCheck(
    userId: number,
    activityId: number,
  ): Promise<UserActivityCheck> {
    return await this.prisma.user_activity_check.create({
      data: {
        userId,
        activityId,
      },
    });
  }

  async deleteCheck(userId: number, activityId: number): Promise<void> {
    await this.prisma.user_activity_check.deleteMany({
      where: {
        userId,
        activityId,
      },
    });
  }

  async createIgnore(userId: number, activityId: number): Promise<void> {
    await this.prisma.user_activity_ignore.create({
      data: {
        userId,
        activityId,
      },
    });
  }

  async deleteIgnore(userId: number, activityId: number): Promise<void> {
    await this.prisma.user_activity_ignore.deleteMany({
      where: {
        userId,
        activityId,
      },
    });
  }
}
