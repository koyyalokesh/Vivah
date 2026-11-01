export function formatEventDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(new Date(value));
}
export function formatEventTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(value));
}
export function toLocalInput(value: string | undefined, timeZone: string) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}
export function localInputToIso(value: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('Choose a valid date and time.');
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const [year, month, day, hour, minute] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
  ].map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  const desiredDate = new Date(desired);
  if (
    desiredDate.getUTCFullYear() !== year ||
    desiredDate.getUTCMonth() !== month - 1 ||
    desiredDate.getUTCDate() !== day ||
    desiredDate.getUTCHours() !== hour ||
    desiredDate.getUTCMinutes() !== minute
  ) {
    throw new Error('Choose a valid date and time.');
  }

  const localEpoch = (instant: number) => {
    const parts = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone,
    }).formatToParts(new Date(instant));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value);
    return Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
    );
  };
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = desired + hours * 60 * 60 * 1000;
    offsets.add(localEpoch(sample) - sample);
  }
  const candidates = [...offsets]
    .map((offset) => desired - offset)
    .filter((instant) => localEpoch(instant) === desired)
    .filter((instant, index, values) => values.indexOf(instant) === index)
    .sort((left, right) => left - right);
  if (candidates.length === 0) {
    throw new Error('That local time does not exist in the wedding time zone.');
  }
  if (candidates.length > 1) {
    throw new Error('That local time occurs twice in the wedding time zone.');
  }
  return new Date(candidates[0]).toISOString();
}
