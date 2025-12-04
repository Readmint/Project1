// reader.routes.ts
import { Router } from 'express';
import {
  getReaderHome,
  getContentById,
  getContentStream,
  postReadingProgress,
  getReadingProgress,
  toggleBookmark,
  toggleLike,
  getRecommendations
} from '../controllers/reader.controller'; // adjust path as needed

const router = Router();

// Public
router.get('/home', getReaderHome);
router.get('/content/:contentId', getContentById);
router.get('/content/:contentId/stream', getContentStream);

// User operations (expects auth middleware upstream that sets req.user and req.user.id)
// Example: app.use('/api/reader', authMiddleware, readerRoutes) or protect individual routes
router.post('/users/:userId/progress', postReadingProgress);
router.get('/users/:userId/progress', getReadingProgress);

router.post('/users/:userId/bookmark', toggleBookmark);
router.post('/users/:userId/like', toggleLike);

router.get('/recommendations/:userId', getRecommendations);

export default router;
