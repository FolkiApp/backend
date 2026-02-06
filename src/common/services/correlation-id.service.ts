/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import * as cls from 'cls-hooked';

const NAMESPACE = 'app-namespace';
const CORRELATION_ID_KEY = 'correlationId';
const USER_ID_KEY = 'userId';
const USER_EMAIL_KEY = 'userEmail';

@Injectable()
export class CorrelationIdService {
  private namespace: cls.Namespace;

  constructor() {
    this.namespace =
      cls.getNamespace(NAMESPACE) || cls.createNamespace(NAMESPACE);
  }

  setCorrelationId(correlationId: string): void {
    this.namespace.set(CORRELATION_ID_KEY, correlationId);
  }

  getCorrelationId(): string | undefined {
    return this.namespace.get(CORRELATION_ID_KEY) as string | undefined;
  }

  setUserId(userId: number): void {
    this.namespace.set(USER_ID_KEY, userId);
  }

  getUserId(): number | undefined {
    return this.namespace.get(USER_ID_KEY) as number | undefined;
  }

  setUserEmail(userEmail: string): void {
    this.namespace.set(USER_EMAIL_KEY, userEmail);
  }

  getUserEmail(): string | undefined {
    return this.namespace.get(USER_EMAIL_KEY) as string | undefined;
  }

  runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
    return this.namespace.runAndReturn(() => {
      this.setCorrelationId(correlationId);
      return fn();
    }) as T;
  }
}
