import { getActivityStringDate } from '../utils/date.utils';

describe('getActivityStringDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve retornar "Hoje" quando a data for o dia atual', () => {
    const today = new Date('2026-01-23T10:00:00');
    jest.setSystemTime(today);

    const result = getActivityStringDate('2026-01-23T15:00:00');

    expect(result).toBe('Hoje');
  });

  it('deve retornar "Amanhã" quando a data for o próximo dia', () => {
    const today = new Date('2026-01-23T10:00:00');
    jest.setSystemTime(today);

    const result = getActivityStringDate('2026-01-24T15:00:00');

    expect(result).toBe('Amanhã');
  });

  it('deve retornar a data formatada para dias futuros', () => {
    const today = new Date('2026-01-23T10:00:00');
    jest.setSystemTime(today);

    const result = getActivityStringDate('2026-01-30T15:00:00');

    expect(result).toBe('30 de janeiro');
  });

  it('deve retornar a data formatada para dias passados', () => {
    const today = new Date('2026-01-23T10:00:00');
    jest.setSystemTime(today);

    const result = getActivityStringDate('2026-01-15T15:00:00');

    expect(result).toBe('15 de janeiro');
  });

  it('deve retornar a data formatada para outros meses', () => {
    const today = new Date('2026-01-23T10:00:00');
    jest.setSystemTime(today);

    const result = getActivityStringDate('2026-02-14T15:00:00');

    expect(result).toBe('14 de fevereiro');
  });

  it('deve retornar a data formatada corretamente para dezembro', () => {
    const today = new Date('2026-01-23T10:00:00');
    jest.setSystemTime(today);

    const result = getActivityStringDate('2026-12-25T15:00:00');

    expect(result).toBe('25 de dezembro');
  });
});
