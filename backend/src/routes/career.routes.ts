import { Router } from 'express';
import {
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
    submitApplication,
    getApplications,
    updateApplicationStatus
} from '../controllers/career.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public Routes
router.get('/roles', getRoles);
router.get('/roles/:id', getRole);
router.post('/apply', submitApplication);

// Admin / Content Manager Routes
// Assuming 'content_manager' is the role name for Content Managers
router.post('/roles', authenticate, authorize('admin', 'content_manager'), createRole);
router.patch('/roles/:id', authenticate, authorize('admin', 'content_manager'), updateRole);
router.delete('/roles/:id', authenticate, authorize('admin', 'content_manager'), deleteRole);

router.get('/applications', authenticate, authorize('admin', 'content_manager'), getApplications);
router.patch('/applications/:id/status', authenticate, authorize('admin', 'content_manager'), updateApplicationStatus);

export default router;
