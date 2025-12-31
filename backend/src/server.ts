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
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ----------------------------- Security Middlewares ----------------------------- */
app.use(helmet());
app.use(compression());

/* ----------------------------------- CORS -------------------------------------- */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

/* -------------------------------- Body Parsers --------------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve local uploads

/* ---------------------------------- Swagger ------------------------------------ */
setupSwagger(app);

/* ----------------------------------- Routes ------------------------------------ */
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/article', articleRoutes); // Fix: Enable access via /api/article/... (singular)
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


    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 ReadMint Backend running at http://localhost:${PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
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
