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
} from '../controllers/article.controller';
import { authenticate } from '../middleware/auth';
import { getCategories } from '../controllers/article.controller';

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

router.get(
  '/author/articles',
  [
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  listAuthorArticles
);
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

// Add this route in article.routes.ts


// Add this route definition
router.get(
  '/categories',
  authenticate,
  getCategories
);

// Request signed upload URL for attachment
router.post(
  '/author/articles/:articleId/attachments/signed-url',
  authenticate,
  getSignedUrlValidation,
  getAttachmentSignedUrl
);

// Finalize attachment after upload
router.post(
  '/author/articles/:articleId/attachments/:attachmentId/complete',
  authenticate,
  completeAttachmentValidation,
  completeAttachmentUpload
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
