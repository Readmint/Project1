import express from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  getCurrentUser, 
  oauth,
  sendVerificationEmail,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} from '../controllers/auth.controller';
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

// Forgot password validation
const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail()
];

const verifyResetOTPValidation = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const resetPasswordValidation = [
  body('email').isEmail().normalizeEmail(),
  body('resetToken').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/send-verification', sendVerificationEmail);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// OAuth route: accepts { idToken, provider } from frontend (Firebase ID token)
router.post('/oauth', oauthValidation, oauth);

// Forgot password routes
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/verify-reset-otp', verifyResetOTPValidation, verifyResetOTP);
router.post('/reset-password', resetPasswordValidation, resetPassword);

router.get('/me', authenticate, getCurrentUser);

export default router;