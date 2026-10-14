import express from 'express';
import type { RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import { createAuthRouter } from './modules/auth/auth.router.js';
import { authService } from './modules/auth/auth.service.js';
import type { AuthServiceContract } from './modules/auth/auth.types.js';
import { ensureDatabaseConnection } from './database/connection.js';
import { errorHandler } from './middleware/error-handler.js';

type AppOptions = {
  service?: AuthServiceContract;
  databaseMiddleware?: RequestHandler;
  enableRateLimit?: boolean;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const service = options.service ?? authService;
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
    createAuthRouter(service, options.enableRateLimit),
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
