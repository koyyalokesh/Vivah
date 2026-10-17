import { Router } from 'express';
import type { AuthServiceContract } from '../auth/auth.types.js';
import {
  requireAuthentication,
  verifyRequestOrigin,
} from '../auth/auth.middleware.js';
import { createWeddingController } from './wedding.controller.js';
import type { WeddingServiceContract } from './wedding.types.js';

export function createWeddingRouter(
  authService: AuthServiceContract,
  weddingService: WeddingServiceContract,
) {
  const router = Router();
  const controller = createWeddingController(weddingService);
  const requireAuth = requireAuthentication(authService);

  router.get('/', requireAuth, controller.getCurrent);
  router.post('/', verifyRequestOrigin, requireAuth, controller.create);
  router.patch('/', verifyRequestOrigin, requireAuth, controller.update);

  return router;
}
