import type { RequestHandler } from 'express';
import { AppError } from '../../shared/app-error.js';
import type { AuthLocals } from '../auth/auth.middleware.js';
import type { EventServiceContract } from './events.types.js';
import {
  createEventSchema,
  listEventsSchema,
  updateEventSchema,
} from './events.validation.js';

function invalid(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}) {
  return new AppError(
    400,
    'VALIDATION_ERROR',
    'Please correct the highlighted fields.',
    error.flatten().fieldErrors,
  );
}

export function createEventsController(service: EventServiceContract) {
  const list: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = listEventsSchema.safeParse(req.query);
    if (!parsed.success) return next(invalid(parsed.error));
    try {
      const events = await service.list(res.locals.user.id, parsed.data);
      res.set('Cache-Control', 'no-store').json({ data: events });
    } catch (error) {
      next(error);
    }
  };
  const get: RequestHandler<
    { eventId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    try {
      const event = await service.get(res.locals.user.id, req.params.eventId);
      res.set('Cache-Control', 'no-store').json({ data: event });
    } catch (error) {
      next(error);
    }
  };
  const create: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) return next(invalid(parsed.error));
    try {
      const event = await service.create(res.locals.user.id, parsed.data);
      res.status(201).set('Cache-Control', 'no-store').json({ data: event });
    } catch (error) {
      next(error);
    }
  };
  const update: RequestHandler<
    { eventId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) return next(invalid(parsed.error));
    try {
      const event = await service.update(
        res.locals.user.id,
        req.params.eventId,
        parsed.data,
      );
      res.set('Cache-Control', 'no-store').json({ data: event });
    } catch (error) {
      next(error);
    }
  };
  const archive: RequestHandler<
    { eventId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    try {
      await service.archive(res.locals.user.id, req.params.eventId);
      res.set('Cache-Control', 'no-store').json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  };
  return { list, get, create, update, archive };
}
