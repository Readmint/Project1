import express from 'express';
import {
  getCategories,
  getMagazines,
  getAuthors,
  getPublicReviews,
  updateDesign,
  submitDesign
} from '../controllers/content.controller';

import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/magazines', getMagazines);
router.get('/authors', getAuthors);
router.get('/reviews/public', getPublicReviews);

// Protected Routes
router.put('/:id/design', authenticate, updateDesign);
router.post('/:id/submit-design', authenticate, submitDesign);

export default router;