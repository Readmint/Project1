"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const contentManager_controller_1 = require("../controllers/contentManager.controller");
const router = express_1.default.Router();
// All routes require authentication and 'content_manager' role
// Note: You might want to allow 'admin' as well if admins should have full access
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('content_manager', 'admin'));
router.get('/submissions', contentManager_controller_1.getSubmissions);
router.get('/submissions/:id', contentManager_controller_1.getSubmissionDetails);
router.get('/editors', contentManager_controller_1.getEditors);
router.get('/reviewers', contentManager_controller_1.getReviewers);
router.post('/assign-editor', contentManager_controller_1.assignEditor);
router.post('/unassign-editor', contentManager_controller_1.unassignEditor);
router.post('/assign-reviewer', contentManager_controller_1.assignReviewer);
router.get('/communications', contentManager_controller_1.getCommunications);
router.get('/notifications', contentManager_controller_1.getNotifications);
router.post('/send-message', contentManager_controller_1.sendMessage);
router.get('/dashboard-stats', contentManager_controller_1.getDashboardStats);
router.post('/check-plagiarism', contentManager_controller_1.checkPlagiarism);
// Publishing Flow
router.get('/publishing/queue', contentManager_controller_1.getReadyToPublish);
router.post('/publishing/publish', contentManager_controller_1.publishContent);
exports.default = router;
//# sourceMappingURL=contentManager.routes.js.map