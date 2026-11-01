import { Router } from 'express';
import type { AuthServiceContract } from '../auth/auth.types.js';
import {
  requireAuthentication,
  verifyRequestOrigin,
} from '../auth/auth.middleware.js';
import { createEventsController } from './events.controller.js';
import type { EventServiceContract } from './events.types.js';

export function createEventsRouter(
  authService: AuthServiceContract,
  eventService: EventServiceContract,
) {
  const router = Router();
  const controller = createEventsController(eventService);
  const requireAuth = requireAuthentication(authService);
  router.get('/', requireAuth, controller.list);
  router.post('/', verifyRequestOrigin, requireAuth, controller.create);
  router.get('/:eventId', requireAuth, controller.get);
  router.patch(
    '/:eventId',
    verifyRequestOrigin,
    requireAuth,
    controller.update,
  );
  router.delete(
    '/:eventId',
    verifyRequestOrigin,
    requireAuth,
    controller.archive,
  );
  return router;
}
