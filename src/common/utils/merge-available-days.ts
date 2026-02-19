/**
 * essa func mergeia horários consecutivos no mesmo dia
 * exemplo: "seg 21:00-22:00" and "seg 22:00-23:00" becomes "seg 21:00-23:00"
 */
export function mergeAvailableDays(
  days: Array<{ day: string; start: string; end: string }>,
): Array<{ day: string; start: string; end: string }> {
  if (!days || days.length === 0) {
    return [];
  }

  const groupedByDay = days.reduce(
    (acc, day) => {
      if (!acc[day.day]) {
        acc[day.day] = [];
      }
      acc[day.day].push(day);
      return acc;
    },
    {} as Record<string, Array<{ day: string; start: string; end: string }>>,
  );

  const merged: Array<{ day: string; start: string; end: string }> = [];

  for (const dayName of Object.keys(groupedByDay)) {
    const daySlots = groupedByDay[dayName];

    daySlots.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    const mergedSlots: Array<{ day: string; start: string; end: string }> = [];

    for (const slot of daySlots) {
      if (mergedSlots.length === 0) {
        mergedSlots.push({ ...slot });
      } else {
        const lastSlot = mergedSlots[mergedSlots.length - 1];

        if (lastSlot.end === slot.start) {
          lastSlot.end = slot.end;
        } else {
          mergedSlots.push({ ...slot });
        }
      }
    }

    merged.push(...mergedSlots);
  }

  return merged;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
