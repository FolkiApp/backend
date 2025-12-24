import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const API_KEY_METADATA = 'requireApiKey';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(
      API_KEY_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!requireApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
      throw new Error('API_KEY não configurada no ambiente');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
