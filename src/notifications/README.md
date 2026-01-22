# Módulo de Notificações - PipoNotificationService

## Descrição

Serviço reutilizável para envio de notificações push utilizando o OneSignal.

## Configuração

Adicione as seguintes variáveis de ambiente ao seu arquivo `.env`:

```env
ONESIGNAL_APP_ID=seu_app_id
ONESIGNAL_API_KEY=sua_api_key
```

## Uso

### 1. Importar o módulo

No módulo onde deseja usar o serviço de notificações, importe o `NotificationsModule`:

```typescript
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { YourService } from './your.service';

@Module({
  imports: [NotificationsModule],
  providers: [YourService],
})
export class YourModule {}
```

### 2. Injetar o serviço

Injete o `PipoNotificationService` em seu service ou controller:

```typescript
import { Injectable } from '@nestjs/common';
import { PipoNotificationService } from '../notifications/services/pipo-notification.service';

@Injectable()
export class YourService {
  constructor(private readonly notificationService: PipoNotificationService) {}

  async notifyUsers(userPlayerIds: string[]) {
    await this.notificationService.sendNotification({
      title: 'Nova Atividade',
      message: 'Uma nova atividade foi criada no seu curso',
      playerIds: userPlayerIds,
    });
  }
}
```

### 3. Exemplo completo

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PipoNotificationService } from '../notifications/services/pipo-notification.service';

@Injectable()
export class ActivityNotificationService {
  private readonly logger = new Logger(ActivityNotificationService.name);

  constructor(private readonly notificationService: PipoNotificationService) {}

  async sendActivityCreatedNotification(
    activityTitle: string,
    studentPlayerIds: string[],
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        title: 'Nova Atividade Disponível',
        message: `A atividade "${activityTitle}" foi criada`,
        playerIds: studentPlayerIds,
      });

      this.logger.log(
        `Notification sent to ${studentPlayerIds.length} students`,
      );
    } catch (error) {
      this.logger.error('Failed to send activity notification', error);
      // O erro já foi tratado pelo PipoNotificationService
    }
  }
}
```

## DTO

### SendNotificationDto

```typescript
{
  title: string;      // Título da notificação
  message: string;    // Mensagem da notificação
  playerIds: string[]; // Array de IDs dos jogadores (devices) do OneSignal
}
```

## Tratamento de Erros

O serviço **não lança exceções**. Em caso de erro ao enviar a notificação, o erro é apenas logado e a execução continua normalmente. Isso garante que falhas no envio de notificações não interrompam o fluxo principal da aplicação.

## Observações

- Se as credenciais do OneSignal não estiverem configuradas, um aviso será registrado no log
- Se nenhum player ID for fornecido, a notificação não será enviada e um aviso será registrado
- Todas as operações são logadas para facilitar o debug
- Erros no envio são logados mas não interrompem a execução
