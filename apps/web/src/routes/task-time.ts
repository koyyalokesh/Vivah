export function dateToWeddingIso(date: string, timeZone: string) {
  if (!date) return null;
  const [year, month, day] = date.split('-').map(Number);
  let guess = Date.UTC(year, month - 1, day);
  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone,
    }).formatToParts(new Date(guess));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    guess +=
      Date.UTC(year, month - 1, day) -
      Date.UTC(
        get('year'),
        get('month') - 1,
        get('day'),
        get('hour'),
        get('minute'),
      );
  }
  return new Date(guess).toISOString();
}
export function weddingDate(value: string | undefined, timeZone: string) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function formatTaskDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(new Date(value));
}
export function isOverdue(
  dueDate: string | undefined,
  status: string,
  timeZone: string,
) {
  if (!dueDate || status === 'COMPLETED') return false;
  const today = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  }).format(new Date());
  return weddingDate(dueDate, timeZone) < today;
}
