import express from 'express';
import {
  getFeaturedContent,
  getTrendingContent,
  getLatestContent,
  getPopularAuthors
} from '../controllers/featured.controller';

const router = express.Router();

router.get('/', getFeaturedContent);
router.get('/trending', getTrendingContent);
router.get('/latest', getLatestContent);
router.get('/authors', getPopularAuthors);

export default router;