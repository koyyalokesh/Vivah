import app from './app.js';
import { config } from './config.js';

const server = app.listen(config.PORT, () => {
  console.log(`Vivah API listening at http://localhost:${config.PORT}`);
});
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Port ${config.PORT} is already in use.`
      : 'Unable to start the API.',
  );
  process.exitCode = 1;
});
