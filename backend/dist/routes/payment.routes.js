"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const payment_controller_1 = require("../controllers/payment.controller");
const router = express_1.default.Router();
// Initiate requires login
router.post('/initiate', auth_1.authenticate, payment_controller_1.initiatePayment);
// Callbacks (PayU calls these via POST usually)
// We might need to bypass CSRF if we had that enabled, but standard express is fine.
// Note: These need to be public or handled carefully as they come from PayU server/redirect.
router.post('/success', payment_controller_1.handlePaymentSuccess); // Redirects user
router.post('/failure', payment_controller_1.handlePaymentFailure); // Redirects user
exports.default = router;
//# sourceMappingURL=payment.routes.js.map