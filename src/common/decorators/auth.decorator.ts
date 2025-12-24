import { SetMetadata } from '@nestjs/common';
import { AUTH_METADATA } from '../guards/auth.guard';

export const Auth = () => SetMetadata(AUTH_METADATA, true);
