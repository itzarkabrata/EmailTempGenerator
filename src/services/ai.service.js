import { GoogleGenAI } from '@google/genai';
import { config } from '../config/config.env.js';
import { logger } from '../utils/logger.js';
import AppError from '../utils/error.js';

const ai = new GoogleGenAI({
  apiKey: config.geminiApiKey,
  httpOptions: { timeout: config.aiTimeoutMs },
});

export async function generateJson({ system, user, responseSchema, requestId }) {
  const start = performance.now();
  try {
    const res = await ai.models.generateContent({
      model: config.model,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseSchema,
        maxOutputTokens: config.maxTokens,
        temperature: 0.7,
      },
    });

    const latencyMs = Math.round(performance.now() - start);
    logger.info('ai_call_completed', {
      requestId,
      model: config.model,
      latencyMs,
      inputTokens: res.usageMetadata?.promptTokenCount,
      outputTokens: res.usageMetadata?.candidatesTokenCount,
    });

    return { text: res.text, latencyMs };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const parsedError = JSON.parse(err.message);
    logger.error('ai_call_failed', { requestId, latencyMs, error: err.message, status: err.status });

    if (err.status === 429) {
      throw new AppError(429, 'AI rate limit reached (free tier). Please retry in a moment.');
    }
    throw new AppError(502, 'AI provider request failed. Please try again.', parsedError.error.message);
  }
}