import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getSubmissions,
    getSubmissionDetails,
    getEditors,
    getReviewers,
    assignEditor,
    unassignEditor,
    assignReviewer,
    getCommunications,
    getNotifications,
    sendMessage,
    getDashboardStats,
    checkPlagiarism
} from '../controllers/contentManager.controller';

const router = express.Router();

// All routes require authentication and 'content_manager' role
// Note: You might want to allow 'admin' as well if admins should have full access
router.use(authenticate);
router.use(authorize('content_manager', 'admin'));

router.get('/submissions', getSubmissions);
router.get('/submissions/:id', getSubmissionDetails);
router.get('/editors', getEditors);
router.get('/reviewers', getReviewers);

router.post('/assign-editor', assignEditor);
router.post('/unassign-editor', unassignEditor);
router.post('/assign-reviewer', assignReviewer);

router.get('/communications', getCommunications);
router.get('/notifications', getNotifications);
router.post('/send-message', sendMessage);
router.get('/dashboard-stats', getDashboardStats);
router.post('/check-plagiarism', checkPlagiarism);

export default router;
