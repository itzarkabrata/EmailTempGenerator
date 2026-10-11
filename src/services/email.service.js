import { generateJson } from './ai.service.js';
import { SYSTEM_PROMPT, buildUserPrompt, EMAIL_RESPONSE_SCHEMA } from '../prompts/email.prompt.js';
import AppError from '../utils/error.js';

function parseTemplate(raw) {
  const parsed = JSON.parse(raw);
  if (typeof parsed.subject !== 'string' || typeof parsed.body !== 'string') {
    throw new Error('missing subject/body');
  }
  return { subject: parsed.subject.trim(), body: parsed.body.trim() };
}

export async function generateEmailTemplate(input, requestId) {
  const { text, latencyMs } = await generateJson({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    responseSchema: EMAIL_RESPONSE_SCHEMA,
    requestId,
  });

  try {
    return { template: parseTemplate(text), latencyMs };
  } catch {
    throw new AppError(502, 'AI returned an unparseable response. Please try again.');
  }
}