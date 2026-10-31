export type WeddingCountdown =
  | { status: 'missing' }
  | { status: 'upcoming'; days: number }
  | { status: 'today' }
  | { status: 'past' };

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function calendarDayNumber(year: number, month: number, day: number) {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function getWeddingCountdown(
  weddingDate?: string,
  timeZone?: string,
  now = new Date(),
): WeddingCountdown {
  const match = weddingDate?.match(calendarDatePattern);
  if (!match || !timeZone) return { status: 'missing' };

  const weddingYear = Number(match[1]);
  const weddingMonth = Number(match[2]);
  const weddingDay = Number(match[3]);
  const parsedWeddingDate = new Date(
    Date.UTC(weddingYear, weddingMonth - 1, weddingDay),
  );
  if (
    parsedWeddingDate.getUTCFullYear() !== weddingYear ||
    parsedWeddingDate.getUTCMonth() !== weddingMonth - 1 ||
    parsedWeddingDate.getUTCDate() !== weddingDay
  ) {
    return { status: 'missing' };
  }

  try {
    const parts = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value);
    const today = calendarDayNumber(part('year'), part('month'), part('day'));
    const wedding = calendarDayNumber(weddingYear, weddingMonth, weddingDay);
    const days = wedding - today;

    if (days > 0) return { status: 'upcoming', days };
    if (days === 0) return { status: 'today' };
    return { status: 'past' };
  } catch {
    return { status: 'missing' };
  }
}
