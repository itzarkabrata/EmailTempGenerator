import AppError from '../utils/error.js';
import { ALLOWED_TONES } from '../prompts/email.prompt.js';

export function validateGenerateEmail(req, _res, next) {
  const { purpose, recipient_name, tone } = req.body || {};
  const errors = [];

  if (typeof purpose !== 'string' || purpose.trim().length < 3 || purpose.length > 300) {
    errors.push('purpose must be a string of 3-300 characters');
  }
  if (typeof recipient_name !== 'string' || !recipient_name.trim() || recipient_name.length > 80) {
    errors.push('recipient_name must be a non-empty string up to 80 characters');
  }
  if (typeof tone !== 'string' || !ALLOWED_TONES.includes(tone.toLowerCase())) {
    errors.push(`tone must be one of: ${ALLOWED_TONES.join(', ')}`);
  }

  if (errors.length) return next(new AppError(400, 'Validation failed', errors));

  // Strip angle brackets so input can't break out of the prompt's XML tags.
  const clean = (s) => s.replace(/[<>]/g, '').trim();
  req.body = {
    purpose: clean(purpose),
    recipient_name: clean(recipient_name),
    tone: tone.toLowerCase(),
  };
  next();
}