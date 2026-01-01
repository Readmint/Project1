
import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    initiatePayment,
    handlePaymentSuccess,
    handlePaymentFailure
} from '../controllers/payment.controller';

const router = express.Router();

// Initiate requires login
router.post('/initiate', authenticate, initiatePayment);

// Callbacks (PayU calls these via POST usually)
// We might need to bypass CSRF if we had that enabled, but standard express is fine.
// Note: These need to be public or handled carefully as they come from PayU server/redirect.
router.post('/success', handlePaymentSuccess); // Redirects user
router.post('/failure', handlePaymentFailure); // Redirects user

export default router;
