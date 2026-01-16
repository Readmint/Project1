// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { connectDatabase } from './config/database';


import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import featuredRoutes from './routes/featured.routes';
import contentRoutes from './routes/content.routes';
import subscriptionRoutes from './routes/subscription.routes';
import authorRoutes from './routes/author.routes';
import contentManagerRoutes from './routes/contentManager.routes';
import articleRoutes from './routes/article.routes';
import readerRoutes from './routes/reader.routes';
import editorRoutes from './routes/editor.routes';
import reviewerRoutes from './routes/reviewer.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import partnerRoutes from './routes/partner.routes';
import advertisementRoutes from './routes/advertisement.routes';
import careerRoutes from './routes/career.routes';
import certificateRoutes from './routes/certificate.routes';
import editorialRoutes from './routes/editorial.routes';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ----------------------------------- CORS -------------------------------------- */
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://readmint-fe3c3.web.app',
    'https://mindradix.com',
    'https://www.mindradix.com',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
};

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Preflight handled by app.use(cors)

/* ----------------------------- Security Middlewares ----------------------------- */
app.use(helmet());
app.use(compression());

/* -------------------------------- Body Parsers --------------------------------- */
/* -------------------------------- Body Parsers --------------------------------- */
const shouldParseBody = (req: express.Request) => {
  // Skip body parsing for multipart uploads (attachments) usually handled by multer
  if (req.originalUrl && req.originalUrl.includes('/attachments')) return false;
  return true;
};

app.use((req, res, next) => {
  if (shouldParseBody(req)) {
    express.json({ limit: '10mb' })(req, res, next);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (shouldParseBody(req)) {
    express.urlencoded({ extended: true })(req, res, next);
  } else {
    next();
  }
});

app.use('/uploads', express.static('uploads')); // Serve local uploads

/* ---------------------------------- Swagger ------------------------------------ */
setupSwagger(app);

/* ----------------------------------- Routes ------------------------------------ */
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/article', articleRoutes); // Fix: Enable access via /api/article/... (singular)
app.use('/api', articleRoutes); // Fix: Enable access via /api/author/articles defined in articleRoutes
app.use('/api/authors', authorRoutes);
app.use('/api/editors', editorRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/content-manager', contentManagerRoutes);
app.use('/api/article', articleRoutes);
app.use('/api/reader', readerRoutes);
app.use('/api/editor', editorRoutes);
app.use('/api/reviewer', reviewerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/editorial', editorialRoutes);
app.use('/api/public/certificates', certificateRoutes); // Public alias for verification

/* ------------------------------- Health Check ---------------------------------- */
app.get('/api/health-check', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ReadMint API is running successfully',
    timestamp: new Date().toISOString(),
  });
});

/* ------------------------------- 404 Handler ----------------------------------- */
app.all('/', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

/* ---------------------------- Global Error Handler ----------------------------- */
app.use(errorHandler);

/* ------------------------------ Start Server ----------------------------------- */
const startServer = async () => {
  try {
    await connectDatabase();


    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 ReadMint Backend running at http://localhost:${PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please close other instances.`);
        logger.error(`Port ${PORT} is in use`, err);
        process.exit(1);
      } else {
        logger.error('Server error:', err);
      }
    });

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);
      logger.error('Unhandled Rejection', err);
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      logger.error('Uncaught Exception', err);
    });
  } catch (error) {
    logger.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;
