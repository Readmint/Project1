import { Router } from 'express';
import { adminLogin, createAdmin, verifyAdmin, getAdminStats, getPlatformHealth, getSystemUsers, manageUserRole, createUser, getAllContent, adminContentAction, getPlagiarismMonitor, verifyPlagiarismReport, getAuditLogs, getIncidents, createIncident, updateIncident, getSystemSettings, updateSystemSettings, getAdvancedAnalytics, createAnnouncement } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public (Protected by Secret Key logic inside controller)
router.post('/register', createAdmin);
router.post('/verify', verifyAdmin);
router.post('/login', adminLogin);

// Protected (Requires Admin Token)
router.get('/stats', authenticate, authorize('admin'), getAdminStats); // Kept for legacy
router.get('/health', authenticate, authorize('admin'), getPlatformHealth);
router.get('/users', authenticate, authorize('admin'), getSystemUsers);
router.post('/users/manage', authenticate, authorize('admin'), manageUserRole);
router.post('/users/create', authenticate, authorize('admin'), createUser);
router.get('/content', authenticate, authorize('admin'), getAllContent);
router.post('/content/action', authenticate, authorize('admin'), adminContentAction);
router.get('/plagiarism', authenticate, authorize('admin'), getPlagiarismMonitor);
router.post('/plagiarism/verify', authenticate, authorize('admin'), verifyPlagiarismReport);
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);

// New Spec Routes
router.get('/incidents', authenticate, authorize('admin'), getIncidents);
router.post('/incidents', authenticate, authorize('admin'), createIncident);
router.post('/incidents/update', authenticate, authorize('admin'), updateIncident);

router.get('/settings', authenticate, authorize('admin'), getSystemSettings);
router.post('/settings', authenticate, authorize('admin'), updateSystemSettings);

router.get('/analytics', authenticate, authorize('admin'), getAdvancedAnalytics);
router.post('/announcements', authenticate, authorize('admin'), createAnnouncement);

export default router;
