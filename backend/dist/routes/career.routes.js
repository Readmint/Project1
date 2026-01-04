"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const career_controller_1 = require("../controllers/career.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public Routes
router.get('/roles', career_controller_1.getRoles);
router.get('/roles/:id', career_controller_1.getRole);
router.post('/apply', career_controller_1.submitApplication);
// Admin / Content Manager Routes
// Assuming 'content_manager' is the role name for Content Managers
router.post('/roles', auth_1.authenticate, (0, auth_1.authorize)('admin', 'content_manager'), career_controller_1.createRole);
router.patch('/roles/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'content_manager'), career_controller_1.updateRole);
router.delete('/roles/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'content_manager'), career_controller_1.deleteRole);
router.get('/applications', auth_1.authenticate, (0, auth_1.authorize)('admin', 'content_manager'), career_controller_1.getApplications);
router.patch('/applications/:id/status', auth_1.authenticate, (0, auth_1.authorize)('admin', 'content_manager'), career_controller_1.updateApplicationStatus);
exports.default = router;
//# sourceMappingURL=career.routes.js.map