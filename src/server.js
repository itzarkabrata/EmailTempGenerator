import { config } from './config/config.env.js';
import app from './app.js';
import { logger } from './utils/logger.js';

app.listen(config.port, () =>
  logger.info('server_started', { port: config.port, model: config.model })
);