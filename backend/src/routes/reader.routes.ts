import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPublishedArticles,
  getMyLibrary,
  getArticleDetails,
  toggleLike,
  postComment,
  getReaderPlans,
  getBookmarks,
  toggleBookmark
} from '../controllers/reader.controller';

const router = Router();

router.get('/articles', authenticate, getPublishedArticles);
router.get('/library', authenticate, getMyLibrary);
router.get('/plans', authenticate, getReaderPlans);
router.get('/bookmarks', authenticate, getBookmarks);
router.post('/bookmarks/:id', authenticate, toggleBookmark); // Toggle using POST on resource
router.get('/article/:id', authenticate, getArticleDetails);
router.post('/article/:id/like', authenticate, toggleLike);
router.post('/article/:id/comment', authenticate, postComment);

export default router;
