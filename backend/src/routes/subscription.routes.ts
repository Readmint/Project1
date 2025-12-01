import express from 'express';
import {
  getSubscriptionPlans,
  createPayUOrder,
  verifyPayUPayment,
  getPaymentStatus,
  payuWebhook,
  getUserSubscriptions,
  getCurrentSubscription,
  activateFreeSubscription,
  cancelSubscription
} from '../controllers/subscription.controller';

const router = express.Router();

// Get subscription plans
router.get('/plans', getSubscriptionPlans);

// Create PayU payment order
router.post('/payu/create-order', createPayUOrder);

// PayU payment verification (callback URL)
router.post('/payu/verify', verifyPayUPayment);

// Check payment status
router.get('/payment/status/:txnid', getPaymentStatus);

// PayU webhook (for server-to-server updates)
router.post('/payu/webhook', payuWebhook);

// Get user subscriptions
router.get('/user/:userId/subscriptions', getUserSubscriptions);

// Get current active subscription
router.get('/user/:userId/current-subscription', getCurrentSubscription);

// Activate free subscription
router.post('/free', activateFreeSubscription);

// Cancel subscription
router.post('/cancel/:subscriptionId', cancelSubscription);

export default router;