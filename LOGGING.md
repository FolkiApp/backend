# Sistema de Logging Estruturado com Correlation ID

## Visão Geral

O sistema de logging foi atualizado para usar logs estruturados em JSON com suporte a **correlation ID**, permitindo rastreamento de requisições no Datadog.

## Características

- ✅ **Logs estruturados em JSON** (em produção)
- ✅ **Correlation ID** automático para cada requisição
- ✅ **Contexto** associado a cada logger
- ✅ **Informações adicionais** (userId, responseTime, etc.)
- ✅ **Compatível com Datadog**

## Formato dos Logs

### Ambiente de Produção (JSON)
```json
{
  "message": "HTTP request completed",
  "method": "POST",
  "url": "/api/activities",
  "userId": 123,
  "userEmail": "user@example.com",
  "responseTime": 245,
  "status": "success",
  "timestamp": "2026-02-05T23:45:00.000Z",
  "context": "HTTP",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "level": "info"
}
```

### Ambiente de Desenvolvimento (Pretty)
```
2026-02-05T23:45:00.000Z [HTTP] info: HTTP request completed [550e8400-e29b-41d4-a716-446655440000] {"method":"POST","url":"/api/activities","userId":123}
```

## Como Usar

### 1. Em Services/Controllers

```typescript
import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../common/logger/custom-logger.service';

@Injectable()
export class MyService {
  private readonly logger: CustomLogger;

  constructor(logger: CustomLogger) {
    this.logger = logger;
    this.logger.setContext('MyService');
  }

  async doSomething() {
    this.logger.log({
      message: 'Operation started',
      operation: 'doSomething',
      additionalInfo: 'value',
    });

    try {
      // ... código
      
      this.logger.log({
        message: 'Operation completed successfully',
        operation: 'doSomething',
        result: 'success',
      });
    } catch (error) {
      this.logger.error({
        message: 'Operation failed',
        operation: 'doSomething',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
```

### 2. Correlation ID

O correlation ID é automaticamente:
- Gerado para cada requisição (usando UUID v4)
- Aceito via header `x-correlation-id` (se fornecido)
- Retornado no header da resposta
- Incluído em todos os logs da requisição

**Exemplo de uso com curl:**
```bash
curl -H "x-correlation-id: my-custom-id-123" http://localhost:3000/api/users
```

### 3. Rastreamento no Datadog

No Datadog, você pode:

**Buscar logs de uma requisição específica:**
```
@correlationId:"550e8400-e29b-41d4-a716-446655440000"
```

**Filtrar logs de um usuário:**
```
@userId:123
```

**Buscar erros de um contexto:**
```
@context:"CreateActivityService" AND @level:error
```

**Análise de performance:**
```
@responseTime:>1000
```

## Variável de Ambiente

Configure `NODE_ENV=production` para logs em JSON estruturado.

## Benefícios

1. **Rastreabilidade completa**: Correlation ID permite seguir toda a jornada de uma requisição
2. **Debugging facilitado**: Logs estruturados são mais fáceis de consultar e filtrar
3. **Monitoramento**: Métricas automáticas de performance (responseTime)
4. **Contexto rico**: Informações do usuário, método HTTP, URL, etc.
5. **Integração nativa com Datadog**: Formato JSON é automaticamente parseado
