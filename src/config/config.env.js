import 'dotenv/config';

console.log('Loaded environment variables:', {
  PORT: process.env.PORT,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '***' : undefined,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
}); 

export const config = Object.freeze({
  port: Number(process.env.PORT) || 5000,
  geminiApiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 1024,
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 20000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
});