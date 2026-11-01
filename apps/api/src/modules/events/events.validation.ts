import { z } from 'zod';
import { eventTypes } from './event.model.js';

const isoInstant = z.iso.datetime({ offset: true });
const optionalText = (maximum: number) =>
  z.union([z.string().trim().max(maximum), z.null()]).optional();

const eventFields = {
  name: z.string().trim().min(1, 'Enter an event name.').max(150),
  type: z.enum(eventTypes).optional(),
  startsAt: isoInstant,
  endsAt: z.union([isoInstant, z.null()]).optional(),
  venueName: optionalText(200),
  address: optionalText(500),
  description: optionalText(2000),
  dressCode: optionalText(200),
};

function validRange(value: { startsAt?: string; endsAt?: string | null }) {
  return (
    !value.startsAt ||
    !value.endsAt ||
    Date.parse(value.endsAt) > Date.parse(value.startsAt)
  );
}

export const createEventSchema = z.object(eventFields).refine(validRange, {
  message: 'End time must be after the start time.',
  path: ['endsAt'],
});

export const updateEventSchema = z
  .object({
    name: eventFields.name.optional(),
    type: z.union([z.enum(eventTypes), z.null()]).optional(),
    startsAt: eventFields.startsAt.optional(),
    endsAt: eventFields.endsAt,
    venueName: eventFields.venueName,
    address: eventFields.address,
    description: eventFields.description,
    dressCode: eventFields.dressCode,
    expectedUpdatedAt: isoInstant,
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    {
      message: 'Provide at least one event detail to update.',
      path: ['name'],
    },
  )
  .refine(validRange, {
    message: 'End time must be after the start time.',
    path: ['endsAt'],
  });

export const listEventsSchema = z.object({
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  from: isoInstant.optional(),
  to: isoInstant.optional(),
});
