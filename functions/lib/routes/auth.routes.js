"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('name').notEmpty().trim()
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty()
];
// OAuth validation - fixed to match frontend payload
const oauthValidation = [
    (0, express_validator_1.body)('idToken').notEmpty().withMessage('ID token is required'),
    (0, express_validator_1.body)('provider').optional().isIn(['google', 'facebook', 'github']).withMessage('Invalid provider')
];
// Forgot password validation
const forgotPasswordValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail()
];
const verifyResetOTPValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];
const resetPasswordValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('resetToken').notEmpty(),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];
// Verification validation
const verifyEmailValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('otp').notEmpty().withMessage('OTP is required')
];
const sendVerificationValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail()
];
// Routes
router.post('/register', registerValidation, auth_controller_1.register);
router.post('/login', loginValidation, auth_controller_1.login);
router.post('/send-verification', sendVerificationValidation, auth_controller_1.sendVerificationEmail);
router.post('/verify-email', verifyEmailValidation, auth_controller_1.verifyEmail);
router.post('/resend-verification', sendVerificationValidation, auth_controller_1.resendVerification);
// OAuth route: accepts { idToken, provider } from frontend (Firebase ID token)
router.post('/oauth', oauthValidation, auth_controller_1.oauth);
// Forgot password routes
router.post('/forgot-password', forgotPasswordValidation, auth_controller_1.forgotPassword);
router.post('/verify-reset-otp', verifyResetOTPValidation, auth_controller_1.verifyResetOTP);
router.post('/reset-password', resetPasswordValidation, auth_controller_1.resetPassword);
router.get('/me', auth_1.authenticate, auth_controller_1.getCurrentUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map