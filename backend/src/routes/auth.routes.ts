import express from 'express';
import { body } from 'express-validator';
import { register, login, getCurrentUser, oauth,sendVerificationEmail,verifyEmail,resendVerification } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// OAuth validation - fixed to match frontend payload
const oauthValidation = [
  body('idToken').notEmpty().withMessage('ID token is required'),
  body('provider').optional().isIn(['google', 'facebook', 'github']).withMessage('Invalid provider')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
// Add these routes
router.post('/send-verification', sendVerificationEmail);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// OAuth route: accepts { idToken, provider } from frontend (Firebase ID token)
router.post('/oauth', oauthValidation, oauth);

router.get('/me', authenticate, getCurrentUser);

export default router;