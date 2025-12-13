// src/routes/editor.route.ts
import express from 'express';
import { body, param } from 'express-validator';
import {
  getEditorProfile,
  saveEditorProfile,
  getAssignedForEditor,
  getSubmittedForEditor,
  getArticleForEdit,
  saveDraft,
  finalizeEditing,
  requestAuthorChanges,
  approveForPublishing,
  getVersions,
  getVersionById,
  restoreVersion,
  uploadEditorResume,
  getEditorAnalytics,
  getCommunications,
  getContentManagers,
  sendMessage,
} from '../controllers/editor.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Validation rules
 */
const saveProfileValidation = [
  body('display_name').optional().isString(),
  body('profile_photo_url').optional().isString(),
  body('bio').optional().isString(),
  body('fields').optional(),
  body('experience_months').optional().isInt().toInt(),
  body('is_active').optional().isBoolean(),
];

const saveDraftValidation = [
  param('id').isString().notEmpty().withMessage('Article id required'),
  body('content').optional().isString(),
  body('metaTitle').optional().isString(),
  body('metaDescription').optional().isString(),
  body('notes').optional().isString(),
];

const finalizeValidation = [
  param('id').isString().notEmpty().withMessage('Article id required'),
  body('finalContent').optional().isString(),
  body('finalizeAs').optional().isIn(['publish', 'review']),
];

const requestChangesValidation = [
  param('id').isString().notEmpty().withMessage('Article id required'),
  body('message').optional().isString(),
  body('severity').optional().isString(),
];

const approveValidation = [
  param('id').isString().notEmpty().withMessage('Article id required'),
];

const versionsValidation = [
  param('id').isString().notEmpty().withMessage('Article id required'),
];

const versionIdValidation = [
  param('versionId').isString().notEmpty().withMessage('versionId required'),
];

/**
 * Routes (protected by authenticate)
 */
router.use(authenticate);

// Profile
router.get('/profile', getEditorProfile);
router.post('/profile', saveProfileValidation, saveEditorProfile);

// Resume upload: multipart/form-data with field 'resume'
router.put('/profile/resume', uploadEditorResume);

// Assignments
router.get('/assigned', getAssignedForEditor);
router.get('/submitted', getSubmittedForEditor);

// Article editing
router.get('/articles/:id', getArticleForEdit);
router.post('/articles/:id/save', saveDraftValidation, saveDraft);
router.post('/articles/:id/finalize', finalizeValidation, finalizeEditing);
router.post('/articles/:id/request-changes', requestChangesValidation, requestAuthorChanges);
router.post('/articles/:id/approve', approveValidation, approveForPublishing);

// Analytics
router.get('/analytics', getEditorAnalytics);

// Communications
router.get('/communications', getCommunications);
router.get('/content-managers', getContentManagers);
router.post('/send-message', sendMessage);

// Versions
router.get('/articles/:id/versions', versionsValidation, getVersions);
router.get('/version/:versionId', versionIdValidation, getVersionById);
router.post('/version/:versionId/restore', versionIdValidation, restoreVersion);

export default router;
