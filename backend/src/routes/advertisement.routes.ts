import { Router } from 'express';
import {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    submitEnquiry,
    getEnquiries,
    updateEnquiryStatus
} from '../controllers/advertisement.controller';
// Assuming auth middleware exists and is exported from '../middleware/auth' or similar
// I will check imports from other route files to be consistent, but for now using generic names
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public Routes
router.get('/plans', getPlans);
router.post('/enquiries', submitEnquiry);

// Admin Routes
router.post('/plans', authenticate, authorize('admin'), createPlan);
router.patch('/plans/:id', authenticate, authorize('admin'), updatePlan);
router.delete('/plans/:id', authenticate, authorize('admin'), deletePlan);

router.get('/enquiries', authenticate, authorize('admin'), getEnquiries);
router.patch('/enquiries/:id/status', authenticate, authorize('admin'), updateEnquiryStatus);


export default router;
