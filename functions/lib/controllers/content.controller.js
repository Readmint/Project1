"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitDesign = exports.updateDesign = exports.getPublicReviews = exports.getAuthors = exports.getMagazines = exports.getCategories = void 0;
// import { getDatabase } from '../config/database'; 
const logger_1 = require("../utils/logger");
const firestore_helpers_1 = require("../utils/firestore-helpers");
const getCategories = async (req, res) => {
    try {
        const categories = await (0, firestore_helpers_1.executeQuery)('categories', [], undefined, { field: 'name', dir: 'asc' });
        // Parent category name logic (Manual Join)
        // If categories have parent_category_id
        const validCategories = await Promise.all(categories.map(async (c) => {
            let parentName = null;
            if (c.parent_category_id) {
                const p = await (0, firestore_helpers_1.getDoc)('categories', c.parent_category_id);
                if (p)
                    parentName = p.name;
            }
            return Object.assign(Object.assign({}, c), { parent_category_name: parentName });
        }));
        res.status(200).json({
            status: 'success',
            data: { categories: validCategories }
        });
    }
    catch (error) {
        logger_1.logger.error('Get categories error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getCategories = getCategories;
const getMagazines = async (req, res) => {
    var _a, _b;
    try {
        const category = req.query.category || undefined;
        const page = Number((_a = req.query.page) !== null && _a !== void 0 ? _a : 1);
        const limit = Number((_b = req.query.limit) !== null && _b !== void 0 ? _b : 12);
        // Offset logic invalid for Firestore in simple terms, but `executeQuery` mimics limit/order.
        // Real Firestore pagination requires cursors. 
        // For now, we will fetch ALMOST ALL or use limit logic from helpers.
        // Helper supports 'limit'. But offset is tricky. 
        // We will use the 'getAll and slice' approach since we lack cursors for now, assuming N < 1000.
        // Build filters
        const filters = [{ field: 'status', op: '==', value: 'published' }];
        if (category) {
            filters.push({ field: 'category_id', op: '==', value: category });
        }
        // Fetch all for pagination (efficient count? no, just fetch all for now or use count helper)
        // We need data, not just count.
        let allMags = await (0, firestore_helpers_1.executeQuery)('content', filters, undefined, { field: 'created_at', dir: 'desc' });
        // Sort logic (already sorted by helpers)
        const totalCount = allMags.length;
        const startIndex = (page - 1) * limit;
        const paginatedMags = allMags.slice(startIndex, startIndex + limit);
        // Expand details (Author Name, Category Name)
        const expandedMags = await Promise.all(paginatedMags.map(async (m) => {
            let authorName = 'Unknown';
            if (m.author_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', m.author_id);
                if (u)
                    authorName = u.name;
            }
            let categoryName = 'Uncategorized';
            if (m.category_id) {
                const c = await (0, firestore_helpers_1.getDoc)('categories', m.category_id);
                if (c)
                    categoryName = c.name;
                else
                    categoryName = m.category_id;
            }
            return Object.assign(Object.assign({}, m), { author_name: authorName, category_name: categoryName });
        }));
        res.status(200).json({
            status: 'success',
            data: {
                magazines: expandedMags,
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get magazines error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getMagazines = getMagazines;
const getAuthors = async (req, res) => {
    try {
        // In Firestore, we use 'author_stats' for pre-aggregated data or fetch users and aggregate manually.
        // Let's use 'author_stats' if available (created in featured controller). 
        // If not, we fetch 'users' where role IN [author, editor].
        // Fetch users
        const authors = await (0, firestore_helpers_1.executeQuery)('users', []);
        const validAuthors = authors.filter((u) => ['author', 'editor'].includes(u.role));
        // To get stats (published_articles, total_likes), we need to query 'content' or 'author_stats'.
        // Querying 'content' for each author is N+1. 
        // Use `author_stats` collection if it exists.
        // Fallback: Fetch ALL published content and aggregate in memory.
        const allContent = await (0, firestore_helpers_1.executeQuery)('content', [{ field: 'status', op: '==', value: 'published' }]);
        const statsMap = new Map();
        allContent.forEach((c) => {
            if (c.author_id) {
                const current = statsMap.get(c.author_id) || { articles: 0, likes: 0 };
                current.articles += 1;
                current.likes += (c.likes_count || 0);
                statsMap.set(c.author_id, current);
            }
        });
        const annotatedAuthors = validAuthors.map((u) => {
            const stats = statsMap.get(u.id) || { articles: 0, likes: 0 };
            return Object.assign(Object.assign({}, u), { published_articles: stats.articles, total_likes: stats.likes, profile_data: u.profile_data || {} // Firestore stores object
             });
        }).sort((a, b) => b.total_likes - a.total_likes);
        res.status(200).json({
            status: 'success',
            data: { authors: annotatedAuthors }
        });
    }
    catch (error) {
        logger_1.logger.error('Get authors error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getAuthors = getAuthors;
const getPublicReviews = async (req, res) => {
    try {
        // Mock reviews for now
        const mockReviews = [
            {
                id: '1',
                reader_name: 'Sarah Johnson',
                rating: 5,
                review: 'Amazing platform with diverse content!',
                magazine_reviewed: 'Tech Insights Monthly'
            },
            {
                id: '2',
                reader_name: 'Mike Chen',
                rating: 4,
                review: 'Great selection of magazines, easy to use interface.',
                magazine_reviewed: 'Business Weekly'
            },
            {
                id: '3',
                reader_name: 'Emma Davis',
                rating: 5,
                review: 'Love the author community and quality content!',
                magazine_reviewed: 'Creative Writing Digest'
            }
        ];
        res.status(200).json({
            status: 'success',
            data: { reviews: mockReviews }
        });
    }
    catch (error) {
        logger_1.logger.error('Get public reviews error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getPublicReviews = getPublicReviews;
const updateDesign = async (req, res) => {
    try {
        const { id } = req.params;
        const { designData, pages } = req.body;
        if (!designData) {
            res.status(400).json({ status: 'error', message: 'No design data provided' });
            return;
        }
        const article = await (0, firestore_helpers_1.getDoc)('content', id);
        if (!article) {
            res.status(404).json({ status: 'error', message: 'Article not found' });
            return;
        }
        // designData is passed as JSON object (or string?). 
        // Firestore stores objects natively.
        // Ensure we store it as object/map.
        let dataToStore = designData;
        if (typeof designData === 'string') {
            try {
                dataToStore = JSON.parse(designData);
            }
            catch (e) { }
        }
        await (0, firestore_helpers_1.updateDoc)('content', id, {
            design_data: dataToStore,
            updated_at: new Date()
        });
        res.status(200).json({
            status: 'success',
            message: 'Design saved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Update design error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.updateDesign = updateDesign;
const submitDesign = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const { designData } = req.body;
        // [NEW] Get User ID (Assuming auth middleware attached it)
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const article = await (0, firestore_helpers_1.getDoc)('content', id);
        if (!article) {
            res.status(404).json({ status: 'error', message: 'Article not found' });
            return;
        }
        const updates = {
            status: 'under_review', // Transition to under_review
            updated_at: new Date()
        };
        if (designData) {
            let dataToStore = designData;
            if (typeof designData === 'string') {
                try {
                    dataToStore = JSON.parse(designData);
                }
                catch (e) { }
            }
            updates.design_data = dataToStore;
        }
        await (0, firestore_helpers_1.updateDoc)('content', id, updates);
        // Create workflow event
        await (0, firestore_helpers_1.createDoc)('workflow_events', {
            article_id: id,
            from_status: article.status,
            to_status: 'under_review',
            note: 'Design submitted by Editor for review',
            created_at: new Date()
        });
        // [NEW] Update Editor Assignment to 'Completed' & Create Version
        if (userId) {
            // 1. Resolve Editor ID
            const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
            const editorId = editorDocs.length > 0 ? editorDocs[0].id : null;
            if (editorId) {
                // 2. Create Version Snapshot
                await (0, firestore_helpers_1.createDoc)('versions', {
                    article_id: id,
                    editor_id: editorId,
                    title: article.title, // or from design data?
                    content: null, // This is design submission, maybe store design snapshot? 
                    // Current version schema expects 'content' string. 
                    // We can convert designData to string or leave null. 
                    // Let's store stringified designData in content for now or just null.
                    meta: {
                        type: 'design_submission',
                        finalized: true,
                        finalizedBy: userId
                    },
                    created_at: new Date()
                });
                // 3. Update/Create Assignment
                const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
                    { field: 'article_id', op: '==', value: id },
                    { field: 'editor_id', op: '==', value: editorId }
                ]);
                if (assignments.length > 0) {
                    for (const assign of assignments) {
                        if (assign.status !== 'cancelled') {
                            await (0, firestore_helpers_1.updateDoc)('editor_assignments', assign.id, {
                                status: 'completed',
                                updated_at: new Date()
                            });
                        }
                    }
                }
                else {
                    // Create self-assignment as completed
                    await (0, firestore_helpers_1.createDoc)('editor_assignments', {
                        editor_id: editorId,
                        article_id: id,
                        assigned_by: null,
                        assigned_date: new Date(),
                        due_date: null,
                        priority: 'Medium',
                        status: 'completed',
                        updated_at: new Date()
                    });
                }
            }
        }
        res.status(200).json({
            status: 'success',
            message: 'Design submitted for review successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Submit design error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.submitDesign = submitDesign;
//# sourceMappingURL=content.controller.js.map