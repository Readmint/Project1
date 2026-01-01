"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const featured_controller_1 = require("../controllers/featured.controller");
const router = express_1.default.Router();
router.get('/', featured_controller_1.getFeaturedContent);
router.get('/trending', featured_controller_1.getTrendingContent);
router.get('/latest', featured_controller_1.getLatestContent);
router.get('/authors', featured_controller_1.getPopularAuthors);
exports.default = router;
//# sourceMappingURL=featured.routes.js.map