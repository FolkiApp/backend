import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../guards/auth.guard';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
