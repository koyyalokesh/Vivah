import express from 'express';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));
app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ data: { status: 'ok' } });
});
app.use((_req, res) => {
  res
    .status(404)
    .json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});
app.use(errorHandler);
// Add future domain routers before the 404 handler; business features use controllers/services.
export default app;
