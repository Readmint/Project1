import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Route Imports
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
import editorialRoutes from './routes/editorial.routes';
// import { setupSwagger } from './config/swagger'; // Disabled for stability

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ----------------------------------- CORS -------------------------------------- */
// Manual CORS Middleware (Replaces 'cors' package to avoid crash)
const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://readmint-fe3c3.web.app', 'https://mindradix.com'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.web.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://readmint-fe3c3.web.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

/* ----------------------------- Security Middlewares ----------------------------- */
app.use(helmet());
app.use(compression());

/* -------------------------------- Body Parsers --------------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static('uploads')); // Local uploads not supported in Functions

/* ---------------------------------- Swagger ------------------------------------ */
// setupSwagger(app);

/* ----------------------------------- Routes ------------------------------------ */
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/article', articleRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/editors', editorRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/content-manager', contentManagerRoutes);
app.use('/api/reader', readerRoutes);
app.use('/api/editor', editorRoutes);
app.use('/api/reviewer', reviewerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/editorial', editorialRoutes);

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

/* ---------------------------- Init Database ------------------------------------ */
// Initialize DB asynchronously
connectDatabase().catch(err => logger.error("DB Init Failed", err));

export default app;
