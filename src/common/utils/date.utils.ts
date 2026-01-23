export function getActivityStringDate(date: string): string {
  const dateObj = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateObj.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (dateObj.toDateString() === tomorrow.toDateString()) {
    return 'Amanhã';
  } else {
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('pt-BR', { month: 'long' });
    return `${day} de ${month}`;
  }
}
