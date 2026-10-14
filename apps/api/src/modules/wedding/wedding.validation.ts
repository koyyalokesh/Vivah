import { z } from 'zod';

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.valueOf()) &&
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3])
  );
}

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);

export const createWeddingSchema = z.object({
  brideName: z.string().trim().min(1, 'Enter partner one’s name.').max(100),
  groomName: z.string().trim().min(1, 'Enter partner two’s name.').max(100),
  title: z.string().trim().min(1, 'Enter a wedding title.').max(150),
  description: optionalText(500),
  weddingDate: z.string().refine(isCalendarDate, 'Enter a valid wedding date.'),
  timeZone: z.string().trim().refine(isTimeZone, 'Select a valid time zone.'),
  location: z
    .object({
      formattedAddress: optionalText(250),
      city: optionalText(100),
      state: optionalText(100),
      country: optionalText(100),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      googlePlaceId: optionalText(250),
    })
    .optional()
    .transform((location) => {
      if (!location) return undefined;
      return Object.values(location).some((value) => value !== undefined)
        ? location
        : undefined;
    }),
});
