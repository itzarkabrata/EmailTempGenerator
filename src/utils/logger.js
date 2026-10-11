const log = (level, message, meta = {}) =>
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, message, ...meta }));

export const logger = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};