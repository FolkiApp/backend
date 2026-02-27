import { ServiceUnavailableException } from '@nestjs/common';

export class UFSCarMaintenanceException extends ServiceUnavailableException {
  public readonly code = 'UFSCAR_MAINTENANCE';

  constructor(
    message = 'Sistema da UFSCar está em manutenção. Tente novamente na volta às aulas.',
    error?: unknown,
  ) {
    super(
      {
        title: 'Sistema em manutenção',
        message,
        code: 'UFSCAR_MAINTENANCE',
      },
      { cause: error },
    );
    this.name = 'UFSCarMaintenanceException';
  }
}
