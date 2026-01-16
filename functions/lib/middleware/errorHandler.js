"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // Log error
    logger_1.logger.error('Error:', err);
    // Force console log for Cloud Functions visibility
    console.error('CRITICAL ERROR:', err);
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    }
    else {
        // Production mode
        if (err.statusCode === 500) {
            res.status(500).json({
                status: 'error',
                message: err.message, // Temporarily exposing message for debugging
                error: err.stack // Temporarily exposing stack for debugging
            });
        }
        else {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
    }
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map