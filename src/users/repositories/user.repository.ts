import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../entities/user.entity';
import { user } from '@prisma/client';
import { UpdateUserData } from './dto/update-user-data.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        instituteId: true,
        courseId: true,
        isAdmin: true,
        isBlocked: true,
        universityId: true,
        userVersion: true,
        createdAt: true,
        lastLogin: true,
        lastAccess: true,
      },
    });

    if (!user) {
      return null;
    }

    return new User(user);
  }

  async findByEmail(email: string): Promise<user | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(
    email: string,
    name: string,
    courseId: number,
    instituteId: number,
    universityId: number,
  ): Promise<user> {
    return this.prisma.user.create({
      data: {
        email,
        name,
        courseId,
        instituteId,
        universityId,
      },
    });
  }

  async updateName(id: number, name: string): Promise<user> {
    return this.prisma.user.update({
      where: { id },
      data: { name },
    });
  }

  async update(id: number, updateData: UpdateUserData): Promise<User> {
    // Remove notificationId do updateData pois não é campo da tabela user
    const { notificationId, ...userUpdateData } = updateData;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: userUpdateData,
      select: {
        id: true,
        email: true,
        name: true,
        instituteId: true,
        courseId: true,
        isAdmin: true,
        isBlocked: true,
        universityId: true,
        userVersion: true,
        createdAt: true,
        lastLogin: true,
        lastAccess: true,
      },
    });

    return new User(updatedUser);
  }
}
