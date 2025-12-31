"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reader_controller_1 = require("../controllers/reader.controller");
const router = (0, express_1.Router)();
router.get('/articles', auth_1.authenticate, reader_controller_1.getPublishedArticles);
router.get('/library', auth_1.authenticate, reader_controller_1.getMyLibrary);
router.get('/plans', auth_1.authenticate, reader_controller_1.getReaderPlans);
router.get('/bookmarks', auth_1.authenticate, reader_controller_1.getBookmarks);
router.post('/bookmarks/:id', auth_1.authenticate, reader_controller_1.toggleBookmark); // Toggle using POST on resource
router.get('/article/:id', auth_1.authenticate, reader_controller_1.getArticleDetails);
router.post('/article/:id/like', auth_1.authenticate, reader_controller_1.toggleLike);
router.post('/article/:id/comment', auth_1.authenticate, reader_controller_1.postComment);
exports.default = router;
//# sourceMappingURL=reader.routes.js.map