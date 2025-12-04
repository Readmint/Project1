import { Router } from 'express';
import { 
  getAuthorProfile, 
  updateAuthorProfile, 
  updateProfilePhoto,
  updateAuthorStats,
  getAuthorStats,
  getSubscriptionPlans,
  getCurrentSubscription,
  getTopAuthors
} from '../controllers/author.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication except getTopAuthors
router.use(authenticate);

// Profile routes
router.get('/profile', getAuthorProfile);
router.put('/profile', updateAuthorProfile);
router.put('/profile/photo', updateProfilePhoto);

// Stats routes
router.get('/stats', getAuthorStats);
router.put('/stats', updateAuthorStats);

// Subscription routes
router.get('/subscription/plans', getSubscriptionPlans);
router.get('/subscription/current', getCurrentSubscription);

// Public route (no authentication required)
router.get('/top', getTopAuthors);


export default router;