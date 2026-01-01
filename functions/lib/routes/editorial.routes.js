"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const editorial_controller_1 = require("../controllers/editorial.controller");
const router = (0, express_1.Router)();
// Configure multer for memory storage (file handling in controller)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
// POST /api/editorial/apply
router.post('/apply', upload.single('resume'), editorial_controller_1.submitApplication);
exports.default = router;
//# sourceMappingURL=editorial.routes.js.map