import { Router } from 'express';
import {
  requireAuthentication,
  verifyRequestOrigin,
} from '../auth/auth.middleware.js';
import type { AuthServiceContract } from '../auth/auth.types.js';
import { createTasksController } from './tasks.controller.js';
import type { TaskServiceContract } from './tasks.types.js';

export function createTasksRouter(
  authService: AuthServiceContract,
  taskService: TaskServiceContract,
) {
  const router = Router();
  const controller = createTasksController(taskService);
  const requireAuth = requireAuthentication(authService);
  router.get('/', requireAuth, controller.list);
  router.post('/', verifyRequestOrigin, requireAuth, controller.create);
  router.get('/:taskId', requireAuth, controller.get);
  router.patch('/:taskId', verifyRequestOrigin, requireAuth, controller.update);
  router.delete(
    '/:taskId',
    verifyRequestOrigin,
    requireAuth,
    controller.remove,
  );
  return router;
}
