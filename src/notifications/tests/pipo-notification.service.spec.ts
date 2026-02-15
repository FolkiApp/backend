import { Test, TestingModule } from '@nestjs/testing';
import { PipoNotificationService } from '../services/pipo-notification.service';
import { CustomLogger } from '../../common/logger/custom-logger.service';

// Mock do OneSignal
jest.mock('onesignal-node', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      createNotification: jest.fn(),
    })),
  };
});

describe('PipoNotificationService', () => {
  let service: PipoNotificationService;
  let mockCreateNotification: jest.Mock;

  const mockCustomLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    // Limpa as variáveis de ambiente
    process.env.ONESIGNAL_APP_ID = 'test-app-id';
    process.env.ONESIGNAL_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipoNotificationService,
        {
          provide: CustomLogger,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    service = module.get<PipoNotificationService>(PipoNotificationService);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    mockCreateNotification = (service as any).client.createNotification;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('deve enviar notificação com sucesso', async () => {
      const dto = {
        title: 'Título do Teste',
        message: 'Mensagem do Teste',
        playerIds: ['player1', 'player2'],
      };

      mockCreateNotification.mockResolvedValue({
        body: { id: 'notification-id', recipients: 2 },
      });

      await expect(service.sendNotification(dto)).resolves.not.toThrow();

      expect(mockCreateNotification).toHaveBeenCalledWith({
        headings: { en: 'Título do Teste' },
        contents: { en: 'Mensagem do Teste' },
        include_player_ids: ['player1', 'player2'],
      });
    });

    it('não deve enviar notificação quando não houver player IDs', async () => {
      const dto = {
        title: 'Título do Teste',
        message: 'Mensagem do Teste',
        playerIds: [],
      };

      await service.sendNotification(dto);

      expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it('não deve lançar erro quando ocorrer falha no envio', async () => {
      const dto = {
        title: 'Título do Teste',
        message: 'Mensagem do Teste',
        playerIds: ['player1'],
      };

      const error = new Error('OneSignal error');
      mockCreateNotification.mockRejectedValue(error);

      await expect(service.sendNotification(dto)).resolves.not.toThrow();
    });
  });
});
