"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
// src/middleware/upload.ts
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
exports.uploadMiddleware = (0, multer_1.default)({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // limit 50MB (adjust)
//# sourceMappingURL=upload.js.map