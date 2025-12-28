import express from 'express';
import {
  getCategories,
  getMagazines,
  getAuthors,
  getPublicReviews,
  updateDesign,
  submitDesign
} from '../controllers/content.controller';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/magazines', getMagazines);
router.get('/authors', getAuthors);
router.get('/reviews/public', getPublicReviews);
router.put('/:id/design', updateDesign);
router.post('/:id/submit-design', submitDesign);

export default router;