"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const editorial_controller_1 = require("../controllers/editorial.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public: Submit Application
router.post('/apply', editorial_controller_1.submitApplication);
// Public: Get Board Members (for Website)
router.get('/board', editorial_controller_1.getBoardMembers);
// Protected: Admin/CM
router.use(auth_1.authenticate);
// Admin: Get Applications
router.get('/applications', editorial_controller_1.getApplications);
// Admin: Manage Board
router.post('/board', editorial_controller_1.addBoardMember);
router.delete('/board/:id', editorial_controller_1.deleteBoardMember);
exports.default = router;
//# sourceMappingURL=editorial.routes.js.map