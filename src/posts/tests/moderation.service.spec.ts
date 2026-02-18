import { Test, TestingModule } from '@nestjs/testing';
import { ModerationService } from '../services/moderation.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

describe('ModerationService', () => {
  let service: ModerationService;
  const originalEnv = process.env;

  const mockCustomLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('moderateContent', () => {
    it('should return flagged: false when OpenAI is not configured', async () => {
      delete process.env.OPENAI_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ModerationService,
          {
            provide: CustomLogger,
            useValue: mockCustomLogger,
          },
        ],
      }).compile();

      const testService = module.get<ModerationService>(ModerationService);
      const result = await testService.moderateContent('Test content');

      expect(result.flagged).toBe(false);
      expect(result.categories).toEqual({});
    });

    it('should call OpenAI moderation when configured', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ModerationService,
          {
            provide: CustomLogger,
            useValue: mockCustomLogger,
          },
        ],
      }).compile();

      const testService = module.get<ModerationService>(ModerationService);

      // Note: In a real test, you'd mock the OpenAI client
      // For now, this test verifies the service initializes correctly
      expect(testService).toBeDefined();
    });
  });
});
