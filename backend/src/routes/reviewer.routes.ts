
import express from 'express';
import { authenticate, authorize } from '../middleware/auth';

import {
    getAssignments,
    updateAssignmentStatus,
    getReviewerStats,
    getCommunications,
    sendMessage
} from '../controllers/reviewer.controller';

const router = express.Router();

// All routes require authentication and 'reviewer' role
router.use(authenticate);
router.use(authorize('reviewer'));

router.get('/assignments', getAssignments);
router.post('/status', updateAssignmentStatus);
router.get('/stats', getReviewerStats);
router.get('/messages', getCommunications);
router.post('/message', sendMessage);

export default router;
