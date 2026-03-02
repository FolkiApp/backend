// Mock global do CustomLogger para testes
jest.mock('./common/logger/custom-logger.service', () => {
  return {
    CustomLogger: jest.fn().mockImplementation(() => ({
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    })),
  };
});

jest.mock('cls-hooked', () => {
  const createMockNamespace = () => {
    const stack: Array<Map<string, unknown>> = [new Map<string, unknown>()];

    return {
      set: jest.fn((key: string, value: unknown) => {
        stack[stack.length - 1].set(key, value);
      }),
      get: jest.fn((key: string) => stack[stack.length - 1].get(key)),
      runAndReturn: jest.fn((fn: () => unknown) => {
        const parent = stack[stack.length - 1];
        const context = new Map<string, unknown>(parent);
        stack.push(context);
        try {
          return fn();
        } finally {
          stack.pop();
        }
      }),
    };
  };

  return {
    getNamespace: jest.fn(() => undefined),
    createNamespace: jest.fn(() => createMockNamespace()),
  };
});
