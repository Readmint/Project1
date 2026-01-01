import { Router } from 'express';
import multer from 'multer';
import { submitApplication } from '../controllers/editorial.controller';

const router = Router();

// Configure multer for memory storage (file handling in controller)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// POST /api/editorial/apply
router.post('/apply', upload.single('resume'), submitApplication);

export default router;
