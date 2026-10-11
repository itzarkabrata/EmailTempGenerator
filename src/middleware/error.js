import { logger } from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || (err.type === 'entity.parse.failed' ? 400 : 500);
  if (status >= 500) logger.error('request_failed', { requestId: req.id, error: err.message });

  res.status(status).json({
    success: false,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    message: status === 500 ? 'Internal server error' : err.message,
    ...(err.details && { details: err.details }),
  });
}