"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public (Protected by Secret Key logic inside controller)
router.post('/register', admin_controller_1.createAdmin);
router.post('/verify', admin_controller_1.verifyAdmin);
router.post('/login', admin_controller_1.adminLogin);
router.post('/forgot-password', admin_controller_1.forgotPassword);
router.post('/reset-password', admin_controller_1.resetPassword);
// Protected (Requires Admin Token)
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getAdminStats); // Kept for legacy
router.get('/health', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getPlatformHealth);
router.get('/users', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getSystemUsers);
router.post('/users/manage', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.manageUserRole);
router.post('/users/create', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.createUser);
router.get('/content', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getAllContent);
router.post('/content/action', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.adminContentAction);
router.get('/plagiarism', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getPlagiarismMonitor);
router.post('/plagiarism/verify', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.verifyPlagiarismReport);
router.get('/audit-logs', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getAuditLogs);
// New Spec Routes
router.get('/incidents', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getIncidents);
router.post('/incidents', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.createIncident);
router.post('/incidents/update', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.updateIncident);
router.get('/settings', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getSystemSettings);
router.post('/settings', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.updateSystemSettings);
router.get('/analytics', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.getAdvancedAnalytics);
router.post('/announcements', auth_1.authenticate, (0, auth_1.authorize)('admin'), admin_controller_1.createAnnouncement);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map