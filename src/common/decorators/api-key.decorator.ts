import { SetMetadata } from '@nestjs/common';
import { API_KEY_METADATA } from '../guards/api-key.guard';

export const ApiKey = () => SetMetadata(API_KEY_METADATA, true);
