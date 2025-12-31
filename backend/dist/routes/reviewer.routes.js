"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const reviewer_controller_1 = require("../controllers/reviewer.controller");
const router = express_1.default.Router();
// All routes require authentication and 'reviewer' role
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('reviewer'));
router.get('/assignments', reviewer_controller_1.getAssignments);
router.get('/content/:id', reviewer_controller_1.getReviewContent);
router.post('/status', reviewer_controller_1.updateAssignmentStatus);
router.get('/stats', reviewer_controller_1.getReviewerStats);
router.get('/messages', reviewer_controller_1.getCommunications);
router.post('/message', reviewer_controller_1.sendMessage);
// Plagiarism Routes
router.post('/plagiarism/check/:id', reviewer_controller_1.checkPlagiarism);
router.get('/plagiarism/status/:id', reviewer_controller_1.getPlagiarismStatus);
exports.default = router;
//# sourceMappingURL=reviewer.routes.js.map