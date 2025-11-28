import express from 'express';
import {
  getCategories,
  getMagazines,
  getAuthors,
  getPublicReviews
} from '../controllers/content.controller';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/magazines', getMagazines);
router.get('/authors', getAuthors);
router.get('/reviews/public', getPublicReviews);

export default router;