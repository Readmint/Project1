"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'readmint-backend' },
    transports: [
        // In Cloud Functions, use Console which maps to Cloud Logging
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
        })
    ]
});
// Optionally add file logging only in dev if needed,
// but local dev usually likes console too.
// Keeping it simple: Console for all environments is safest for serverless.
//# sourceMappingURL=logger.js.map