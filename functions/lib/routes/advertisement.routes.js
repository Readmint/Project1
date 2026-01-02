"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const advertisement_controller_1 = require("../controllers/advertisement.controller");
// Assuming auth middleware exists and is exported from '../middleware/auth' or similar
// I will check imports from other route files to be consistent, but for now using generic names
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public Routes
router.get('/plans', advertisement_controller_1.getPlans);
router.post('/enquiries', advertisement_controller_1.submitEnquiry);
// Admin Routes
router.post('/plans', auth_1.authenticate, (0, auth_1.authorize)('admin'), advertisement_controller_1.createPlan);
router.patch('/plans/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), advertisement_controller_1.updatePlan);
router.delete('/plans/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), advertisement_controller_1.deletePlan);
router.get('/enquiries', auth_1.authenticate, (0, auth_1.authorize)('admin'), advertisement_controller_1.getEnquiries);
router.patch('/enquiries/:id/status', auth_1.authenticate, (0, auth_1.authorize)('admin'), advertisement_controller_1.updateEnquiryStatus);
exports.default = router;
//# sourceMappingURL=advertisement.routes.js.map