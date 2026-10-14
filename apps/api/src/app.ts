import express from 'express';
import type { RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import { createAuthRouter } from './modules/auth/auth.router.js';
import { authService } from './modules/auth/auth.service.js';
import type { AuthServiceContract } from './modules/auth/auth.types.js';
import { ensureDatabaseConnection } from './database/connection.js';
import { errorHandler } from './middleware/error-handler.js';
import { createWeddingRouter } from './modules/wedding/wedding.router.js';
import { weddingService } from './modules/wedding/wedding.service.js';
import type { WeddingServiceContract } from './modules/wedding/wedding.types.js';

type AppOptions = {
  service?: AuthServiceContract;
  weddingService?: WeddingServiceContract;
  databaseMiddleware?: RequestHandler;
  enableRateLimit?: boolean;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const service = options.service ?? authService;
  const currentWeddingService = options.weddingService ?? weddingService;
  const databaseMiddleware =
    options.databaseMiddleware ?? ensureDatabaseConnection;

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '8kb' }));
  app.use(cookieParser());
  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ data: { status: 'ok' } });
  });
  app.use(
    '/api/auth',
    databaseMiddleware,
    createAuthRouter(service, currentWeddingService, options.enableRateLimit),
  );
  app.use(
    '/api/wedding',
    databaseMiddleware,
    createWeddingRouter(service, currentWeddingService),
  );
  app.use((_req, res) => {
    res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  });
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
