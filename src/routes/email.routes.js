import { Router } from 'express';
import { generateEmail } from '../controllers/email.controller.js';
import { validateGenerateEmail } from '../middleware/validate.js';

const router = Router();
router.post('/generate', validateGenerateEmail, generateEmail);

export default router;