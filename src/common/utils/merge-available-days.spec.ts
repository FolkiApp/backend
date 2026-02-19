import { mergeAvailableDays } from './merge-available-days';

describe('mergeAvailableDays', () => {
  it('should merge consecutive time slots on the same day', () => {
    const input = [
      { day: 'seg', start: '21:00', end: '22:00' },
      { day: 'seg', start: '22:00', end: '23:00' },
    ];

    const result = mergeAvailableDays(input);

    expect(result).toEqual([{ day: 'seg', start: '21:00', end: '23:00' }]);
  });

  it('should merge multiple consecutive slots on the same day', () => {
    const input = [
      { day: 'seg', start: '21:00', end: '22:00' },
      { day: 'seg', start: '22:00', end: '23:00' },
      { day: 'seg', start: '23:00', end: '00:00' },
    ];

    const result = mergeAvailableDays(input);

    expect(result).toEqual([{ day: 'seg', start: '21:00', end: '00:00' }]);
  });

  it('should not merge non-consecutive slots', () => {
    const input = [
      { day: 'seg', start: '21:00', end: '22:00' },
      { day: 'seg', start: '23:00', end: '00:00' },
    ];

    const result = mergeAvailableDays(input);

    expect(result).toEqual([
      { day: 'seg', start: '21:00', end: '22:00' },
      { day: 'seg', start: '23:00', end: '00:00' },
    ]);
  });

  it('should handle multiple days correctly', () => {
    const input = [
      { day: 'seg', start: '21:00', end: '22:00' },
      { day: 'qua', start: '19:00', end: '20:00' },
      { day: 'seg', start: '22:00', end: '23:00' },
      { day: 'qua', start: '20:00', end: '21:00' },
    ];

    const result = mergeAvailableDays(input);

    expect(result).toEqual([
      { day: 'seg', start: '21:00', end: '23:00' },
      { day: 'qua', start: '19:00', end: '21:00' },
    ]);
  });

  it('should handle empty input', () => {
    const result = mergeAvailableDays([]);
    expect(result).toEqual([]);
  });

  it('should handle single slot', () => {
    const input = [{ day: 'seg', start: '21:00', end: '22:00' }];
    const result = mergeAvailableDays(input);
    expect(result).toEqual(input);
  });

  it('should sort by start time before merging', () => {
    const input = [
      { day: 'seg', start: '23:00', end: '00:00' },
      { day: 'seg', start: '21:00', end: '22:00' },
      { day: 'seg', start: '22:00', end: '23:00' },
    ];

    const result = mergeAvailableDays(input);

    expect(result).toEqual([{ day: 'seg', start: '21:00', end: '00:00' }]);
  });

  it('should handle the example from the user request', () => {
    const input = [
      { day: 'seg', start: '21:00', end: '22:00' },
      { day: 'seg', start: '22:00', end: '23:00' },
      { day: 'qua', start: '19:00', end: '20:00' },
      { day: 'qua', start: '20:00', end: '21:00' },
    ];

    const result = mergeAvailableDays(input);

    expect(result).toEqual([
      { day: 'seg', start: '21:00', end: '23:00' },
      { day: 'qua', start: '19:00', end: '21:00' },
    ]);
  });
});
