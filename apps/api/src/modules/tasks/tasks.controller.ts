import type { RequestHandler } from 'express';
import { AppError } from '../../shared/app-error.js';
import type { AuthLocals } from '../auth/auth.middleware.js';
import type { TaskServiceContract } from './tasks.types.js';
import {
  createTaskSchema,
  listTasksSchema,
  updateTaskSchema,
} from './tasks.validation.js';

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
export function createTasksController(service: TaskServiceContract) {
  const list: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = listTasksSchema.safeParse(req.query);
    if (!parsed.success) return next(invalid(parsed.error));
    try {
      const result = await service.list(res.locals.user.id, parsed.data);
      res.set('Cache-Control', 'no-store').json(result);
    } catch (error) {
      next(error);
    }
  };
  const get: RequestHandler<
    { taskId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store').json({
        data: await service.get(res.locals.user.id, req.params.taskId),
      });
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
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) return next(invalid(parsed.error));
    try {
      res
        .status(201)
        .set('Cache-Control', 'no-store')
        .json({ data: await service.create(res.locals.user.id, parsed.data) });
    } catch (error) {
      next(error);
    }
  };
  const update: RequestHandler<
    { taskId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) return next(invalid(parsed.error));
    try {
      res.set('Cache-Control', 'no-store').json({
        data: await service.update(
          res.locals.user.id,
          req.params.taskId,
          parsed.data,
        ),
      });
    } catch (error) {
      next(error);
    }
  };
  const remove: RequestHandler<
    { taskId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    try {
      await service.delete(res.locals.user.id, req.params.taskId);
      res.set('Cache-Control', 'no-store').json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  };
  return { list, get, create, update, remove };
}
