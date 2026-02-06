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
