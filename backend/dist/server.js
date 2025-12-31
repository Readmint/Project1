"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const content_routes_1 = __importDefault(require("./routes/content.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const author_routes_1 = __importDefault(require("./routes/author.routes"));
const contentManager_routes_1 = __importDefault(require("./routes/contentManager.routes"));
const article_routes_1 = __importDefault(require("./routes/article.routes"));
const reader_routes_1 = __importDefault(require("./routes/reader.routes"));
const editor_routes_1 = __importDefault(require("./routes/editor.routes"));
const reviewer_routes_1 = __importDefault(require("./routes/reviewer.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const partner_routes_1 = __importDefault(require("./routes/partner.routes"));
const swagger_1 = require("./config/swagger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
/* ----------------------------- Security Middlewares ----------------------------- */
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
/* ----------------------------------- CORS -------------------------------------- */
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
/* -------------------------------- Body Parsers --------------------------------- */
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static('uploads')); // Serve local uploads
/* ---------------------------------- Swagger ------------------------------------ */
(0, swagger_1.setupSwagger)(app);
/* ----------------------------------- Routes ------------------------------------ */
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/articles', article_routes_1.default);
app.use('/api/article', article_routes_1.default); // Fix: Enable access via /api/article/... (singular)
app.use('/api/authors', author_routes_1.default);
app.use('/api/editors', editor_routes_1.default);
app.use('/api/subscription', subscription_routes_1.default);
app.use('/api/content', content_routes_1.default);
app.use('/api/content-manager', contentManager_routes_1.default);
app.use('/api/article', article_routes_1.default);
app.use('/api/reader', reader_routes_1.default);
app.use('/api/editor', editor_routes_1.default);
app.use('/api/reviewer', reviewer_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
app.use('/api/partner', partner_routes_1.default);
/* ------------------------------- Health Check ---------------------------------- */
app.get('/api/health-check', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'ReadMint API is running successfully',
        timestamp: new Date().toISOString(),
    });
});
/* ------------------------------- 404 Handler ----------------------------------- */
app.all('/', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
    });
});
/* ---------------------------- Global Error Handler ----------------------------- */
app.use(errorHandler_1.errorHandler);
/* ------------------------------ Start Server ----------------------------------- */
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        app.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
            console.log(`🚀 ReadMint Backend running at http://localhost:${PORT}`);
            console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Server failed to start:', error);
        process.exit(1);
    }
};
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=server.js.map