import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { InvalidAuthHeaderException } from '../exceptions/invalid-auth-header.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { UserBlockedException } from '../exceptions/user-blocked.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { CustomLogger } from '../logger/custom-logger.service';
import { CorrelationIdService } from '../services/correlation-id.service';
import { Institute } from '../../institutes/entities/institute.entity';
import { University } from '../../universities/entities/university.entity';

export const AUTH_METADATA = 'requireAuth';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  instituteId: number | null;
  courseId: number | null;
  universityId: number | null;
  isBlocked: boolean;
  userVersion: string | null;
  institute: Institute | null;
  university: University | null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private readonly logger: CustomLogger,
    private readonly correlationIdService: CorrelationIdService,
  ) {
    this.logger.setContext('AuthGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireAuth = this.reflector.getAllAndOverride<boolean>(
      AUTH_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new InvalidAuthHeaderException();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      throw new InvalidAuthHeaderException();
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      throw new InvalidAuthHeaderException();
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        this.logger.error({
          message: 'JWT_SECRET not configured in environment',
        });
        throw new Error('JWT_SECRET not configured in environment');
      }

      const tokenData = jwt.verify(token, jwtSecret) as {
        id: number;
        securePin: string;
      };

      const user = await this.prisma.user.findUnique({
        where: { id: tokenData.id },
        select: {
          email: true,
          id: true,
          name: true,
          securePin: true,
          isAdmin: true,
          instituteId: true,
          courseId: true,
          userVersion: true,
          isBlocked: true,
          universityId: true,
          institute: true,
          university: true,
        },
      });

      if (!user) {
        this.logger.warn({
          message: 'Access attempt with non-existent userId',
          userId: tokenData.id,
        });
        throw new UserNotFoundException();
      }

      if (user.securePin !== tokenData.securePin) {
        this.logger.warn({
          message: 'Blocked user attempted login',
          userId: user.id,
          email: user.email,
        });
        throw new UserBlockedException();
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { securePin, ...userWithoutPin } = user;
      (request as Request & { user: AuthUser }).user = userWithoutPin;

      // Set user context for subsequent logs
      this.correlationIdService.setUserId(user.id);
      this.correlationIdService.setUserEmail(user.email);

      this.logger.log({
        message: 'User authenticated via guard',
        userId: user.id,
        email: user.email,
        universityId: user.universityId,
      });

      return true;
    } catch (err: unknown) {
      if (
        err instanceof InvalidAuthHeaderException ||
        err instanceof UserNotFoundException ||
        err instanceof UserBlockedException
      ) {
        throw err;
      }

      if (err instanceof Error) {
        if (err.name === 'JsonWebTokenError') {
          this.logger.warn({
            message: 'Invalid JWT token',
            errorName: err.name,
          });
          throw new InvalidTokenException();
        }

        if (err.name === 'TokenExpiredError') {
          this.logger.warn({
            message: 'Expired JWT token',
            errorName: err.name,
          });
          throw new InvalidTokenException();
        }

        this.logger.error({
          message: 'Unexpected authentication error',
          errorMessage: err.message,
          errorName: err.name,
          stack: err.stack,
        });
      }

      throw new InvalidTokenException();
    }
  }
}
