"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscription_controller_1 = require("../controllers/subscription.controller");
const router = express_1.default.Router();
// Get subscription plans
router.get('/plans', subscription_controller_1.getSubscriptionPlans);
// Create PayU payment order
router.post('/payu/create-order', subscription_controller_1.createPayUOrder);
// PayU payment verification (callback URL)
router.post('/payu/verify', subscription_controller_1.verifyPayUPayment);
// Check payment status
router.get('/payment/status/:txnid', subscription_controller_1.getPaymentStatus);
// PayU webhook (for server-to-server updates)
router.post('/payu/webhook', subscription_controller_1.payuWebhook);
// Get user subscriptions
router.get('/user/:userId/subscriptions', subscription_controller_1.getUserSubscriptions);
// Get current active subscription
router.get('/user/:userId/current-subscription', subscription_controller_1.getCurrentSubscription);
// Activate free subscription
router.post('/free', subscription_controller_1.activateFreeSubscription);
// Cancel subscription
router.post('/cancel/:subscriptionId', subscription_controller_1.cancelSubscription);
// NEW: Author Plans
router.get('/plans/author', subscription_controller_1.getAuthorSubscriptionPlans);
// NEW: Payment History
router.get('/history/:userId', subscription_controller_1.getUserPaymentHistory);
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map