import app from './app.js';
import { config } from './config.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';

try {
  await connectDatabase();

  const server = app.listen(config.PORT, () => {
    console.log(`Vivah API listening at http://localhost:${config.PORT}`);
  });

  server.once('error', (error: NodeJS.ErrnoException) => {
    console.error(
      error.code === 'EADDRINUSE'
        ? `Port ${config.PORT} is already in use.`
        : 'Unable to start the API.',
    );
    void disconnectDatabase().finally(() => process.exit(1));
  });

  const shutdown = () => {
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit());
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Unable to start the API.',
  );
  process.exitCode = 1;
}
