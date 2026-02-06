import { CorrelationIdService } from './correlation-id.service';

describe('CorrelationIdService', () => {
  let service: CorrelationIdService;

  beforeEach(() => {
    service = new CorrelationIdService();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve armazenar e recuperar correlation ID', () => {
    const correlationId = 'test-correlation-id-123';

    service.runWithCorrelationId(correlationId, () => {
      const retrieved = service.getCorrelationId();
      expect(retrieved).toBe(correlationId);
    });
  });

  it('deve retornar undefined quando não há correlation ID', () => {
    const retrieved = service.getCorrelationId();
    expect(retrieved).toBeUndefined();
  });

  it('deve manter correlation ID isolado por contexto', () => {
    const id1 = 'correlation-id-1';
    const id2 = 'correlation-id-2';

    service.runWithCorrelationId(id1, () => {
      expect(service.getCorrelationId()).toBe(id1);

      service.runWithCorrelationId(id2, () => {
        expect(service.getCorrelationId()).toBe(id2);
      });

      expect(service.getCorrelationId()).toBe(id1);
    });
  });
});
