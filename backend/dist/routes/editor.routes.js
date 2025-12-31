"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/editor.route.ts
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const editor_controller_1 = require("../controllers/editor.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * Validation rules
 */
const saveProfileValidation = [
    (0, express_validator_1.body)('display_name').optional().isString(),
    (0, express_validator_1.body)('profile_photo_url').optional().isString(),
    (0, express_validator_1.body)('bio').optional().isString(),
    (0, express_validator_1.body)('fields').optional(),
    (0, express_validator_1.body)('experience_months').optional().isInt().toInt(),
    (0, express_validator_1.body)('is_active').optional().isBoolean(),
];
const saveDraftValidation = [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Article id required'),
    (0, express_validator_1.body)('content').optional().isString(),
    (0, express_validator_1.body)('metaTitle').optional().isString(),
    (0, express_validator_1.body)('metaDescription').optional().isString(),
    (0, express_validator_1.body)('notes').optional().isString(),
];
const finalizeValidation = [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Article id required'),
    (0, express_validator_1.body)('finalContent').optional().isString(),
    (0, express_validator_1.body)('finalizeAs').optional().isIn(['publish', 'review']),
];
const requestChangesValidation = [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Article id required'),
    (0, express_validator_1.body)('message').optional().isString(),
    (0, express_validator_1.body)('severity').optional().isString(),
];
const approveValidation = [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Article id required'),
];
const versionsValidation = [
    (0, express_validator_1.param)('id').isString().notEmpty().withMessage('Article id required'),
];
const versionIdValidation = [
    (0, express_validator_1.param)('versionId').isString().notEmpty().withMessage('versionId required'),
];
/**
 * Routes (protected by authenticate)
 */
router.use(auth_1.authenticate);
// Profile
router.get('/profile', editor_controller_1.getEditorProfile);
router.post('/profile', saveProfileValidation, editor_controller_1.saveEditorProfile);
// Resume upload: multipart/form-data with field 'resume'
router.put('/profile/resume', editor_controller_1.uploadEditorResume);
// Assignments
router.get('/assigned', editor_controller_1.getAssignedForEditor);
router.get('/submitted', editor_controller_1.getSubmittedForEditor);
// Article editing
router.get('/articles/:id', editor_controller_1.getArticleForEdit);
router.post('/articles/:id/save', saveDraftValidation, editor_controller_1.saveDraft);
router.post('/articles/:id/finalize', finalizeValidation, editor_controller_1.finalizeEditing);
router.post('/articles/:id/request-changes', requestChangesValidation, editor_controller_1.requestAuthorChanges);
router.post('/articles/:id/approve', approveValidation, editor_controller_1.approveForPublishing);
// Analytics
router.get('/analytics', editor_controller_1.getEditorAnalytics);
// Communications
router.get('/communications', editor_controller_1.getCommunications);
router.get('/content-managers', editor_controller_1.getContentManagers);
router.post('/send-message', editor_controller_1.sendMessage);
// Versions
router.get('/articles/:id/versions', versionsValidation, editor_controller_1.getVersions);
router.get('/version/:versionId', versionIdValidation, editor_controller_1.getVersionById);
router.post('/version/:versionId/restore', versionIdValidation, editor_controller_1.restoreVersion);
exports.default = router;
//# sourceMappingURL=editor.routes.js.map