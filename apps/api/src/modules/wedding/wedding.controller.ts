import type { RequestHandler } from 'express';
import { AppError } from '../../shared/app-error.js';
import type { AuthLocals } from '../auth/auth.middleware.js';
import type { WeddingServiceContract } from './wedding.types.js';
import {
  createWeddingSchema,
  updateWeddingSchema,
} from './wedding.validation.js';

function validationError(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}) {
  return new AppError(
    400,
    'VALIDATION_ERROR',
    'Please correct the highlighted fields.',
    error.flatten().fieldErrors,
  );
}

export function createWeddingController(service: WeddingServiceContract) {
  const create: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = createWeddingSchema.safeParse(req.body);
    if (!parsed.success) {
      next(validationError(parsed.error));
      return;
    }

    try {
      const context = await service.createWedding(
        res.locals.user.id,
        parsed.data,
      );
      res.status(201).json({ data: context });
    } catch (error) {
      next(error);
    }
  };

  const getCurrent: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (_req, res, next) => {
    try {
      const context = await service.getContextForUser(res.locals.user.id);
      if (!context) {
        next(new AppError(404, 'NOT_FOUND', 'Wedding not found.'));
        return;
      }
      res.set('Cache-Control', 'no-store').json({ data: context.wedding });
    } catch (error) {
      next(error);
    }
  };

  const update: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = updateWeddingSchema.safeParse(req.body);
    if (!parsed.success) {
      next(validationError(parsed.error));
      return;
    }

    try {
      const wedding = await service.updateWedding(
        res.locals.user.id,
        parsed.data,
      );
      res.set('Cache-Control', 'no-store').json({ data: wedding });
    } catch (error) {
      next(error);
    }
  };

  return { create, getCurrent, update };
}
