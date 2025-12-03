// routes/article.route.ts
import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createArticle,
  getAttachmentSignedUrl,
  completeAttachmentUpload,
  listAuthorArticles,
  getArticleDetails,
  updateArticleStatus,
  deleteArticle,
  getCategories,
  // New handlers:
  downloadAttachment,
  deleteAttachment,
  uploadAttachment,
} from '../controllers/article.controller';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();

/**
 * Validation rules
 */
const createArticleValidation = [
  body('title').isString().trim().notEmpty().withMessage('Title is required'),
  body('summary').optional().isString(),
  body('content').optional().isString(),
  body('category_id').optional().isString().withMessage('category_id must be a string'),
  body('tags').optional().isArray().withMessage('tags must be an array'),
  body('tags.*').optional().isString().withMessage('each tag must be a string'),
  body('status')
    .optional()
    .isIn(['draft', 'submitted'])
    .withMessage('status must be either draft or submitted'),
  body('issue_id').optional().isString(),
];

const getSignedUrlValidation = [
  param('articleId').isString().notEmpty().withMessage('articleId is required'),
  body('filename').isString().notEmpty().withMessage('filename is required'),
  body('contentType').optional().isString(),
];

const completeAttachmentValidation = [
  param('articleId').isString().notEmpty().withMessage('articleId is required'),
  param('attachmentId').isString().notEmpty().withMessage('attachmentId is required'),
  body('makePublic').optional().isBoolean(),
];

const listArticlesValidation = [
  query('status').optional().isString().withMessage('status must be a comma separated string'),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const getArticleValidation = [
  param('articleId').isString().notEmpty().withMessage('articleId is required'),
];

const updateStatusValidation = [
  param('articleId').isString().notEmpty().withMessage('articleId is required'),
  body('status')
    .isString()
    .notEmpty()
    .isIn(['submitted', 'under_review', 'changes_requested', 'approved', 'published', 'rejected'])
    .withMessage(
      'status must be one of submitted, under_review, changes_requested, approved, published, rejected'
    ),
  body('note').optional().isString(),
];

const deleteArticleValidation = [
  param('articleId').isString().notEmpty().withMessage('articleId is required'),
];

// Create multer instance for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_UPLOAD_BYTES || String(50 * 1024 * 1024), 10),
  },
});

/**
 * Routes
 */

// Create article (author)
router.post(
  '/author/articles',
  authenticate,
  createArticleValidation,
  createArticle
);

// Categories
router.get(
  '/categories',
  authenticate,
  getCategories
);

// Legacy signed URL endpoints (kept for compatibility)
router.post(
  '/author/articles/:articleId/attachments/signed-url',
  authenticate,
  getSignedUrlValidation,
  getAttachmentSignedUrl
);

router.post(
  '/author/articles/:articleId/attachments/:attachmentId/complete',
  authenticate,
  completeAttachmentValidation,
  completeAttachmentUpload
);

// NEW: Upload attachment to server (GCS-backed). Multipart using field "file".
router.post(
  '/author/articles/:articleId/attachments',
  authenticate,
  // Apply multer middleware here
  upload.single('file'),
  // Then call the handler
  uploadAttachment
);

// NEW: Download attachment (streams / redirects to signed URL)
router.get(
  '/author/articles/:articleId/attachments/:attachmentId',
  authenticate,
  // validate params
  param('articleId').isString().notEmpty().withMessage('articleId is required'),
  param('attachmentId').isString().notEmpty().withMessage('attachmentId is required'),
  // actual handler
  downloadAttachment
);

// NEW: Delete attachment
router.delete(
  '/author/articles/:articleId/attachments/:attachmentId',
  authenticate,
  param('articleId').isString().notEmpty().withMessage('articleId is required'),
  param('attachmentId').isString().notEmpty().withMessage('attachmentId is required'),
  deleteAttachment
);

// List articles (author)
router.get(
  '/author/my-articles',
  authenticate,
  listArticlesValidation,
  listAuthorArticles
);

// Get single article details
router.get(
  '/author/articles/:articleId',
  authenticate,
  getArticleValidation,
  getArticleDetails
);

// Update article status (author/editor workflow)
router.patch(
  '/author/articles/:articleId/status',
  authenticate,
  updateStatusValidation,
  updateArticleStatus
);

// Delete article (drafts by author, admin otherwise)
router.delete(
  '/author/articles/:articleId',
  authenticate,
  deleteArticleValidation,
  deleteArticle
);

export default router;
