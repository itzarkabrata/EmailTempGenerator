import express from 'express';
import crypto from 'node:crypto';
import emailRoutes from './routes/email.routes.js';
import { errorHandler } from './middleware/error.js';
import AppError from './utils/error.js';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/emails', emailRoutes);

app.use((_req, _res, next) => next(new AppError(404, 'Route not found')));

app.use(errorHandler);

export default app;