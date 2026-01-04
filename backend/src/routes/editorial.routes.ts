import express from 'express';
import {
    submitApplication,
    getApplications,
    getBoardMembers,
    addBoardMember,
    deleteBoardMember
} from '../controllers/editorial.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public: Submit Application
router.post('/apply', submitApplication);

// Public: Get Board Members (for Website)
router.get('/board', getBoardMembers);

// Protected: Admin/CM
router.use(authenticate);

// Admin: Get Applications
router.get('/applications', getApplications);

// Admin: Manage Board
router.post('/board', addBoardMember);
router.delete('/board/:id', deleteBoardMember);

export default router;
