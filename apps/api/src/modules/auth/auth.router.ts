import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAuthController } from './auth.controller.js';
import {
  requireAuthentication,
  verifyRequestOrigin,
} from './auth.middleware.js';
import type {
  AuthServiceContract,
  CurrentWeddingContextReader,
} from './auth.types.js';
import { MongoRateLimitStore } from './rate-limit.store.js';

const authenticationWindowMs = 15 * 60 * 1000;

export function createAuthRouter(
  service: AuthServiceContract,
  weddingContext: CurrentWeddingContextReader,
  enableRateLimit = true,
) {
  const router = Router();
  const controller = createAuthController(service, weddingContext);
  const limit: RequestHandler = enableRateLimit
    ? rateLimit({
        windowMs: authenticationWindowMs,
        limit: 20,
        store: new MongoRateLimitStore(
          undefined,
          undefined,
          authenticationWindowMs,
        ),
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many attempts. Please try again later.',
          },
        },
      })
    : (_req, _res, next) => {
        next();
      };

  router.post('/signup', verifyRequestOrigin, limit, controller.signup);
  router.post('/login', verifyRequestOrigin, limit, controller.login);
  router.post(
    '/logout',
    verifyRequestOrigin,
    requireAuthentication(service),
    controller.logout,
  );
  router.get('/me', requireAuthentication(service), controller.me);

  return router;
}
