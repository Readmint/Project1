import { Router } from 'express';
import { generateCertificateManually, verifyCertificate, getMyCertificates } from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public verification
router.get('/:certId/verify', verifyCertificate as any);
router.get('/my-certificates', authenticate as any, getMyCertificates as any);

// Admin manual generation
router.post('/generate', generateCertificateManually as any);

export default router;
