import { Injectable } from '@nestjs/common';
import * as cls from 'cls-hooked';

const NAMESPACE = 'app-namespace';
const CORRELATION_ID_KEY = 'correlationId';

@Injectable()
export class CorrelationIdService {
  private namespace: cls.Namespace;

  constructor() {
    this.namespace = cls.getNamespace(NAMESPACE) || cls.createNamespace(NAMESPACE);
  }

  setCorrelationId(correlationId: string): void {
    this.namespace.set(CORRELATION_ID_KEY, correlationId);
  }

  getCorrelationId(): string | undefined {
    return this.namespace.get(CORRELATION_ID_KEY) as string | undefined;
  }

  runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
    return this.namespace.runAndReturn(() => {
      this.setCorrelationId(correlationId);
      return fn();
    }) as T;
  }
}
