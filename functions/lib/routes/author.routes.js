"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const author_controller_1 = require("../controllers/author.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication except getTopAuthors
router.use(auth_1.authenticate);
// Profile routes
router.get('/profile', author_controller_1.getAuthorProfile);
router.put('/profile', author_controller_1.updateAuthorProfile);
router.put('/profile/photo', author_controller_1.updateProfilePhoto);
// Stats routes
router.get('/stats', author_controller_1.getAuthorStats);
router.put('/stats', author_controller_1.updateAuthorStats);
// Subscription routes
router.get('/subscription/plans', author_controller_1.getSubscriptionPlans);
router.get('/subscription/current', author_controller_1.getCurrentSubscription);
// Public route (no authentication required)
router.get('/top', author_controller_1.getTopAuthors);
exports.default = router;
//# sourceMappingURL=author.routes.js.map