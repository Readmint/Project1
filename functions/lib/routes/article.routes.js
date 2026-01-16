"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/article.route.ts
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const article_controller_1 = require("../controllers/article.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * Validation rules
 */
const createArticleValidation = [
    (0, express_validator_1.body)('title').isString().trim().notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('summary').optional().isString(),
    (0, express_validator_1.body)('content').optional().isString(),
    (0, express_validator_1.body)('category_id').optional().isString().withMessage('category_id must be a string'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('tags must be an array'),
    (0, express_validator_1.body)('tags.*').optional().isString().withMessage('each tag must be a string'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['draft', 'submitted'])
        .withMessage('status must be either draft or submitted'),
    (0, express_validator_1.body)('issue_id').optional().isString(),
];
const getSignedUrlValidation = [
    (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'),
    (0, express_validator_1.body)('filename').isString().notEmpty().withMessage('filename is required'),
    (0, express_validator_1.body)('contentType').optional().isString(),
];
const completeAttachmentValidation = [
    (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'),
    (0, express_validator_1.param)('attachmentId').isString().notEmpty().withMessage('attachmentId is required'),
    (0, express_validator_1.body)('makePublic').optional().isBoolean(),
];
const listArticlesValidation = [
    (0, express_validator_1.query)('status').optional().isString().withMessage('status must be a comma separated string'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
];
const getArticleValidation = [
    (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'),
];
const updateStatusValidation = [
    (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'),
    (0, express_validator_1.body)('status')
        .isString()
        .notEmpty()
        .isIn(['submitted', 'under_review', 'changes_requested', 'approved', 'published', 'rejected'])
        .withMessage('status must be one of submitted, under_review, changes_requested, approved, published, rejected'),
    (0, express_validator_1.body)('note').optional().isString(),
];
const deleteArticleValidation = [
    (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'),
];
/**
 * Routes
 */
// Create article (author)
router.post('/author/articles', auth_1.authenticate, createArticleValidation, article_controller_1.createArticle);
// Categories
router.get('/categories', auth_1.authenticate, article_controller_1.getCategories);
// Legacy signed URL endpoints (kept for compatibility)
router.post('/author/articles/:articleId/attachments/signed-url', auth_1.authenticate, getSignedUrlValidation, article_controller_1.getAttachmentSignedUrl);
router.post('/author/articles/:articleId/attachments/:attachmentId/complete', auth_1.authenticate, completeAttachmentValidation, article_controller_1.completeAttachmentUpload);
// NEW: Upload attachment to server (GCS-backed). Multipart using field "file".
router.post('/author/articles/:articleId/attachments', auth_1.authenticate, 
// Then call the handler
article_controller_1.uploadAttachment);
// NEW: Download attachment (streams / redirects to signed URL)
router.get('/author/articles/:articleId/attachments/:attachmentId', auth_1.authenticate, 
// validate params
(0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'), (0, express_validator_1.param)('attachmentId').isString().notEmpty().withMessage('attachmentId is required'), 
// actual handler
article_controller_1.downloadAttachment);
// NEW: Delete attachment
router.delete('/author/articles/:articleId/attachments/:attachmentId', auth_1.authenticate, (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'), (0, express_validator_1.param)('attachmentId').isString().notEmpty().withMessage('attachmentId is required'), article_controller_1.deleteAttachment);
// List articles (author)
router.get('/author/my-articles', auth_1.authenticate, listArticlesValidation, article_controller_1.listAuthorArticles);
// Get single article details
router.get('/author/articles/:articleId', auth_1.authenticate, getArticleValidation, article_controller_1.getArticleDetails);
// Update article content (for author edits)
router.patch('/author/articles/:articleId', auth_1.authenticate, 
// Add validation similar to create
[
    (0, express_validator_1.param)('articleId').isString().notEmpty(),
    (0, express_validator_1.body)('title').optional().isString().trim(),
    (0, express_validator_1.body)('summary').optional().isString(),
    (0, express_validator_1.body)('content').optional().isString(),
    (0, express_validator_1.body)('tags').optional().isArray(),
], article_controller_1.updateArticleContent // Imported from controller (need to export it first)
);
// Update article status (author/editor workflow)
router.patch('/author/articles/:articleId/status', auth_1.authenticate, updateStatusValidation, article_controller_1.updateArticleStatus);
//Plagrism checker
router.post('/author/articles/:articleId/similarity', auth_1.authenticate, (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'), article_controller_1.runSimilarityCheck // Make sure to import this from your controller
);
router.post('/articles/:articleId/plagiarism', auth_1.authenticate, (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'), article_controller_1.runPlagiarismCheck);
// Add this route near other article routes
// add near other attachment routes in routes/article.route.ts
router.get('/author/articles/:articleId/attachments/:attachmentId/signed-url', auth_1.authenticate, (0, express_validator_1.param)('articleId').isString().notEmpty().withMessage('articleId is required'), (0, express_validator_1.param)('attachmentId').isString().notEmpty().withMessage('attachmentId is required'), article_controller_1.getAttachmentSignedDownloadUrl);
// Delete article (drafts by author, admin otherwise)
router.delete('/author/articles/:articleId', auth_1.authenticate, deleteArticleValidation, article_controller_1.deleteArticle);
exports.default = router;
//# sourceMappingURL=article.routes.js.map