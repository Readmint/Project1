"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const content_controller_1 = require("../controllers/content.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/categories', content_controller_1.getCategories);
router.get('/magazines', content_controller_1.getMagazines);
router.get('/authors', content_controller_1.getAuthors);
router.get('/reviews/public', content_controller_1.getPublicReviews);
// Protected Routes
router.put('/:id/design', auth_1.authenticate, content_controller_1.updateDesign);
router.post('/:id/submit-design', auth_1.authenticate, content_controller_1.submitDesign);
exports.default = router;
//# sourceMappingURL=content.routes.js.map