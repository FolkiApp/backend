# Guia de Migração para o Novo Sistema de Logging

## Antes vs Depois

### ❌ Antes (Logger antigo)

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CreateActivityService {
  private readonly logger: CustomLogger(CreateActivityService.name);

  constructor(/* dependencies */) {}

  async execute() {
    this.logger.log({
      message: 'Executing createActivity',
      userId: user.id,
    });
  }
}
```

### ✅ Depois (Logger estruturado com Correlation ID)

```typescript
import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../../common/logger/custom-logger.service';

@Injectable()
export class CreateActivityService {
  private readonly logger: CustomLogger;

  constructor(
    logger: CustomLogger,
    /* other dependencies */
  ) {
    this.logger = logger;
    this.logger.setContext('CreateActivityService');
  }

  async execute() {
    this.logger.log({
      message: 'Executing createActivity',
      userId: user.id,
    });
  }
}
```

## Passos para Migração

### 1. Atualizar Import

```typescript
// Remova:
import { Injectable, Logger } from '@nestjs/common';

// Adicione:
import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../../common/logger/custom-logger.service';
```

### 2. Atualizar Declaração do Logger

```typescript
// Remova:
private readonly logger: CustomLogger(CreateActivityService.name);

// Adicione:
private readonly logger: CustomLogger;
```

### 3. Injetar via Constructor

```typescript
constructor(
  logger: CustomLogger,  // ← Adicione este parâmetro
  // ... outros serviços
) {
  this.logger = logger;
  this.logger.setContext('CreateActivityService'); // ← Nome do serviço
}
```

### 4. Uso permanece o mesmo! 🎉

```typescript
// Todos esses métodos continuam funcionando:
this.logger.log({ message: 'info' });
this.logger.error({ message: 'erro', error });
this.logger.warn({ message: 'aviso' });
this.logger.debug({ message: 'debug' });
```

## Exemplo Completo

```typescript
import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../../common/logger/custom-logger.service';

@Injectable()
export class UserService {
  private readonly logger: CustomLogger;

  constructor(
    logger: CustomLogger,
    private readonly prisma: PrismaService,
  ) {
    this.logger = logger;
    this.logger.setContext('UserService');
  }

  async createUser(data: CreateUserDto) {
    this.logger.log({
      message: 'Creating new user',
      email: data.email,
    });

    try {
      const user = await this.prisma.user.create({ data });

      this.logger.log({
        message: 'User created successfully',
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      this.logger.error({
        message: 'Failed to create user',
        email: data.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
```

## Benefícios da Migração

✅ **Correlation ID automático** - todos os logs da mesma requisição terão o mesmo ID  
✅ **Logs estruturados em JSON** - melhor para parsing no Datadog  
✅ **Contexto preservado** - sabe de qual serviço veio cada log  
✅ **Backward compatible** - a API do logger é a mesma  
✅ **Zero breaking changes** - código antigo continua funcionando

## Checklist de Migração

- [ ] Atualizar imports
- [ ] Remover `new Logger()`
- [ ] Adicionar `logger: CustomLogger` no constructor
- [ ] Chamar `setContext()` com nome do serviço
- [ ] Testar localmente
- [ ] Verificar logs no Datadog após deploy

## Migrando Todos os Serviços

Você pode usar este script bash para encontrar todos os arquivos que precisam ser migrados:

```bash
# Encontrar todos os arquivos que usam Logger do NestJS
grep -r "new Logger(" src/ --include="*.ts" | cut -d: -f1 | sort | uniq
```

## Dúvidas Comuns

**Q: Preciso migrar todos os serviços de uma vez?**  
R: Não! O sistema é retrocompatível. Migre gradualmente.

**Q: E se eu esquecer de chamar setContext()?**  
R: Vai funcionar normalmente, mas o contexto será undefined nos logs.

**Q: Posso usar em interceptors e middlewares?**  
R: Sim! Injete da mesma forma que em services.

**Q: Funciona com Guards e Filters?**  
R: Sim, desde que você injete via constructor (não funciona com classes instanciadas diretamente no main.ts).
