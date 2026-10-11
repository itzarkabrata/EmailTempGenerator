import * as emailService from '../services/email.service.js';

// Controller: HTTP in/out only. No prompt or AI logic here.
export async function generateEmail(req, res, next) {
  try {
    const { template, latencyMs } = await emailService.generateEmailTemplate(req.body, req.id);
    res.status(200).json({
      success: true,
      message: 'Email template generated successfully',
      timestamp: new Date().toISOString(),
      data: { ...template, tone: req.body.tone, recipient_name: req.body.recipient_name },
      meta: { requestId: req.id, aiLatencyMs: latencyMs },
    });
  } catch (err) {
    next(err);
  }
}