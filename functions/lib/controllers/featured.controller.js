"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPopularAuthors = exports.getLatestContent = exports.getTrendingContent = exports.getFeaturedContent = void 0;
const logger_1 = require("../utils/logger");
const firestore_helpers_1 = require("../utils/firestore-helpers");
const getFeaturedContent = async (req, res) => {
    try {
        // Get featured content
        const featuredContent = await (0, firestore_helpers_1.executeQuery)('content', [
            { field: 'featured', op: '==', value: true },
            { field: 'status', op: '==', value: 'published' }
        ], 10, { field: 'created_at', dir: 'desc' });
        // Manual join for author names and categories
        const results = await Promise.all(featuredContent.map(async (c) => {
            let authorName = 'Unknown';
            if (c.author_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', c.author_id);
                if (u)
                    authorName = u.name;
            }
            // Category is often stored as ID. If we have a categories collection, we could fetch it.
            // Assuming category_id stores the name directly or we skip specific category name lookup for now 
            // as categories collection usage is minimal in migration plan.
            const categoryName = c.category_id || 'General';
            return Object.assign(Object.assign({}, c), { author_name: authorName, category_name: categoryName });
        }));
        res.status(200).json({
            status: 'success',
            data: { featured: results }
        });
    }
    catch (error) {
        logger_1.logger.error('Get featured content error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getFeaturedContent = getFeaturedContent;
const getTrendingContent = async (req, res) => {
    try {
        // Get trending content
        // Sort by trending_score desc, likes_count desc
        // executeQuery supports one orderBy. Firestore supports multiple if index exists.
        // We'll sort by trending_score.
        const trendingContent = await (0, firestore_helpers_1.executeQuery)('content', [
            { field: 'status', op: '==', value: 'published' }
        ], 15, { field: 'trending_score', dir: 'desc' });
        // Manual join
        const results = await Promise.all(trendingContent.map(async (c) => {
            let authorName = 'Unknown';
            if (c.author_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', c.author_id);
                if (u)
                    authorName = u.name;
            }
            return Object.assign(Object.assign({}, c), { author_name: authorName, category_name: c.category_id || 'General' });
        }));
        res.status(200).json({
            status: 'success',
            data: { trending: results }
        });
    }
    catch (error) {
        logger_1.logger.error('Get trending content error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getTrendingContent = getTrendingContent;
const getLatestContent = async (req, res) => {
    try {
        // Get latest content
        const latestContent = await (0, firestore_helpers_1.executeQuery)('content', [
            { field: 'status', op: '==', value: 'published' }
        ], 20, { field: 'created_at', dir: 'desc' });
        // Manual join
        const results = await Promise.all(latestContent.map(async (c) => {
            let authorName = 'Unknown';
            if (c.author_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', c.author_id);
                if (u)
                    authorName = u.name;
            }
            return Object.assign(Object.assign({}, c), { author_name: authorName, category_name: c.category_id || 'General' });
        }));
        res.status(200).json({
            status: 'success',
            data: { latest: results }
        });
    }
    catch (error) {
        logger_1.logger.error('Get latest content error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getLatestContent = getLatestContent;
const getPopularAuthors = async (req, res) => {
    try {
        // Use author_stats to get popular authors
        const topStats = await (0, firestore_helpers_1.executeQuery)('author_stats', [], 12, { field: 'total_views', dir: 'desc' });
        // Fetch author details
        const authors = await Promise.all(topStats.map(async (stat) => {
            let authorUser = null;
            if (stat.author_id) {
                // Try author profile first
                authorUser = await (0, firestore_helpers_1.getDoc)('authors', stat.author_id);
                // If not found (maybe author_id is user_id), try users?
                if (!authorUser) {
                    const u = await (0, firestore_helpers_1.getDoc)('users', stat.author_id);
                    if (u) {
                        authorUser = {
                            id: u.id,
                            display_name: u.name,
                            user_id: u.id,
                            profile_photo_url: null
                        };
                    }
                }
            }
            if (!authorUser)
                return null;
            return {
                id: authorUser.id, // author profile id or user id
                name: authorUser.display_name,
                email: null, // Don't expose email publicly?
                role: 'author',
                profile_data: {}, // simplified
                content_count: stat.articles_published || 0,
                total_likes: stat.total_views || 0 // Proxy views as likes/popularity since likes might not be aggregated
            };
        }));
        // Filter nulls
        const validAuthors = authors.filter(a => a !== null);
        res.status(200).json({
            status: 'success',
            data: { authors: validAuthors }
        });
    }
    catch (error) {
        logger_1.logger.error('Get popular authors error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getPopularAuthors = getPopularAuthors;
//# sourceMappingURL=featured.controller.js.map