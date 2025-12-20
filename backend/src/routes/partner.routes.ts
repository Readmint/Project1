import express from 'express';
import { body } from 'express-validator';
import * as partnerController from '../controllers/partner.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Middleware to protect routes
router.use(authenticate);

// Admin: Create a new Partner Organization
router.post(
    '/create-partner',
    [
        body('email').isEmail(),
        body('password').isLength({ min: 6 }),
        body('name').notEmpty(),
        body('organization_name').notEmpty(),
    ],
    partnerController.createPartner
);

// Partner: Create a managed user (Author/Reader)
router.post(
    '/users',
    [
        body('email').isEmail(),
        body('password').isLength({ min: 6 }),
        body('name').notEmpty(),
        body('role').isIn(['author', 'reader']),
    ],
    partnerController.createManagedUser
);

// Partner: Create an event
router.post(
    '/events',
    [
        body('title').notEmpty(),
        body('start_date').isISO8601(),
    ],
    partnerController.createEvent
);

// Partner/User: List events
router.get('/events', partnerController.listEvents);

// Partner: Dashboard Stats
router.get('/stats', partnerController.getPartnerStats);

// Admin: List all partners
router.get('/all', partnerController.getAllPartners);

export default router;
