import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPublishedArticles,
  getMyLibrary,
  getArticleDetails,
  toggleLike,
  postComment
} from '../controllers/reader.controller';

const router = Router();

router.get('/articles', authenticate, getPublishedArticles);
router.get('/library', authenticate, getMyLibrary);
router.get('/article/:id', authenticate, getArticleDetails);
router.post('/article/:id/like', authenticate, toggleLike);
router.post('/article/:id/comment', authenticate, postComment);

export default router;
