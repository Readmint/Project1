import express from 'express';
import { getSubscriptionPlans } from '../controllers/subscription.controller';

const router = express.Router();

router.get('/plans', getSubscriptionPlans);

export default router;