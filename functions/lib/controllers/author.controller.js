"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopAuthors = exports.addEarnings = exports.incrementViews = exports.incrementArticleCount = exports.getCurrentSubscriptionInternal = exports.getCurrentSubscription = exports.getSubscriptionPlans = exports.getAuthorStats = exports.updateAuthorStats = exports.updateProfilePhoto = exports.updateAuthorProfile = exports.getAuthorProfile = void 0;
const firestore_helpers_1 = require("../utils/firestore-helpers");
const logger_1 = require("../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const extractUserIdFromRequest = (req) => {
    var _a, _b, _c, _d;
    try {
        const maybeUser = req.user;
        if (maybeUser) {
            if (typeof maybeUser === "string")
                return maybeUser;
            const id = maybeUser.id ||
                maybeUser._id ||
                maybeUser.userId ||
                maybeUser.user_id ||
                maybeUser.uid;
            if (id)
                return String(id);
        }
        const headerUserId = (req.headers["x-user-id"] || req.headers["x_user_id"]);
        if (headerUserId)
            return headerUserId;
        if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId)
            return String(req.body.userId);
        if ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id)
            return String(req.body.id);
        if ((_c = req.query) === null || _c === void 0 ? void 0 : _c.userId)
            return String(req.query.userId);
        if ((_d = req.query) === null || _d === void 0 ? void 0 : _d.id)
            return String(req.query.id);
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (typeof authHeader === "string") {
            const m = authHeader.match(/Bearer\s+(.+)/i);
            const token = m ? m[1] : authHeader;
            if (token) {
                try {
                    const decoded = jsonwebtoken_1.default.decode(token, { json: true });
                    if (decoded) {
                        const extracted = decoded.sub ||
                            decoded.user_id ||
                            decoded.uid ||
                            decoded.id ||
                            decoded.email;
                        if (extracted)
                            return String(extracted);
                    }
                }
                catch (_e) {
                    // ignore
                }
            }
        }
    }
    catch (_f) {
        // ignore
    }
    return null;
};
const buildGuestProfile = () => {
    const now = new Date().toISOString();
    return {
        id: "guest",
        email: "guest@local.dev",
        role: "guest",
        name: "Guest Author",
        photo: "https://via.placeholder.com/150/6d28d9/ffffff?text=Guest",
        location: "",
        bio: "",
        legalName: "",
        qualifications: "",
        specialty: "",
        tags: [],
        socialLinks: {},
        payoutDetails: {},
        isVerified: false,
        joinedDate: now,
        stats: {
            articles: 0,
            views: 0,
            certificates: 0,
            earnings: 0,
            monthlyEarnings: 0,
            rank: 0,
        },
        membership: {
            planName: "Free Plan",
            priceMonthly: 0,
            status: "free",
            endDate: null,
            features: [],
        },
    };
};
const getAuthorProfile = async (req, res) => {
    try {
        const userId = extractUserIdFromRequest(req);
        if (!userId) {
            if (process.env.ALLOW_GUEST_PROFILE === "true") {
                const profile = buildGuestProfile();
                res.json({ success: true, profile });
                return;
            }
            res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "User ID not found in request. Ensure authentication middleware runs or provide a valid token.",
            });
            return;
        }
        const user = await (0, firestore_helpers_1.getDoc)('users', userId);
        if (!user) {
            res.status(404).json({ success: false, error: "User not found", message: "User does not exist in database" });
            return;
        }
        // Try to get author profile using userId as doc ID (Migration strategy: we assume new paradigm)
        // If old data exists with auto-ID, this might miss it. 
        // BUT since we are migrating, we can enforce creating new docs with userId as Key or migrating data.
        // For now, let's try getDoc('authors', userId).
        let authorProfile = await (0, firestore_helpers_1.getDoc)('authors', userId);
        // Backward compatibility check (optional logic, but let's stick to simplicity for migration)
        // If we were strictly migrating SQL data 1:1, we would query by user_id field.
        // simpler: Let's assume we migrated data to have ID = userId, OR we query.
        // Let's QUERY first to be safe, if we haven't strictly enforced ID=userId yet.
        if (!authorProfile) {
            const authors = await (0, firestore_helpers_1.executeQuery)('authors', [{ field: 'user_id', op: '==', value: userId }]);
            if (authors.length > 0)
                authorProfile = authors[0];
        }
        if (!authorProfile) {
            // Create new
            const newAuthor = {
                user_id: userId,
                display_name: user.name || "",
                profile_photo_url: "https://via.placeholder.com/150/6d28d9/ffffff?text=Author",
                location: "",
                bio: "",
                legal_name: user.name || "",
                qualifications: "",
                specialty: "",
                tags: "[]",
                social_links: "{}",
                payout_details: "{}",
                is_verified: false,
                created_at: new Date()
            };
            // Use userId as doc ID for future easier access
            authorProfile = await (0, firestore_helpers_1.createDoc)('authors', newAuthor, userId);
        }
        // Get Stats
        // Assuming author_stats linked by author_id (which is userId if we use that, or random ID)
        // We check both keys
        let stats = null;
        if (authorProfile.id) {
            // Try finding stats by author_id field
            const s = await (0, firestore_helpers_1.executeQuery)('author_stats', [{ field: 'author_id', op: '==', value: authorProfile.id }]);
            if (s.length > 0)
                stats = s[0];
        }
        if (!stats) {
            // Try getting by doc ID = userId (if we unify)
            const s = await (0, firestore_helpers_1.getDoc)('author_stats', userId);
            if (s)
                stats = s;
        }
        let membership = null;
        try {
            membership = await (0, exports.getCurrentSubscriptionInternal)(userId);
        }
        catch (_a) {
            membership = null;
        }
        if (!membership) {
            membership = {
                planName: "Free Plan",
                priceMonthly: 0,
                status: "free",
                endDate: null,
                features: [],
            };
        }
        const parseJSONSafe = (val) => {
            if (!val)
                return null;
            if (typeof val === 'object')
                return val; // Already object in Firestore
            try {
                return JSON.parse(val);
            }
            catch (_a) {
                return null;
            }
        };
        const joinedDate = authorProfile.created_at ? (authorProfile.created_at.toDate ? authorProfile.created_at.toDate().toISOString() : new Date(authorProfile.created_at).toISOString()) : new Date().toISOString();
        const profile = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: authorProfile.display_name || user.name || "",
            photo: authorProfile.profile_photo_url || "https://via.placeholder.com/150/6d28d9/ffffff?text=Author",
            location: authorProfile.location || "",
            bio: authorProfile.bio || "",
            legalName: authorProfile.legal_name || user.name || "",
            qualifications: authorProfile.qualifications || "",
            specialty: authorProfile.specialty || "",
            tags: parseJSONSafe(authorProfile.tags) || [],
            socialLinks: parseJSONSafe(authorProfile.social_links) || {},
            payoutDetails: parseJSONSafe(authorProfile.payout_details) || {},
            isVerified: authorProfile.is_verified || false,
            joinedDate,
            stats: stats
                ? {
                    articles: stats.articles_published || 0,
                    views: stats.total_views || 0,
                    certificates: stats.certificates_earned || 0,
                    earnings: stats.total_earnings || 0,
                    monthlyEarnings: stats.monthly_earnings || 0,
                    rank: stats.rank || stats.author_rank || 0,
                }
                : {
                    articles: 0,
                    views: 0,
                    certificates: 0,
                    earnings: 0,
                    monthlyEarnings: 0,
                    rank: 0,
                },
            membership,
        };
        res.json({ success: true, profile });
    }
    catch (error) {
        if (error instanceof Error)
            logger_1.logger.error("Error fetching author profile:", error.message);
        else
            logger_1.logger.error("Error fetching author profile:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getAuthorProfile = getAuthorProfile;
const updateAuthorProfile = async (req, res) => {
    try {
        let userId = extractUserIdFromRequest(req);
        const updates = req.body || {};
        if (!userId) {
            if (process.env.ALLOW_GUEST_PROFILE === "true") {
                res.json({ success: true, message: "Guest profile update ignored in dev." });
                return;
            }
            res.status(401).json({ error: "Unauthorized", details: "User ID not found in request" });
            return;
        }
        // Find author
        let authorId = null;
        let author = await (0, firestore_helpers_1.getDoc)('authors', userId);
        if (author) {
            authorId = author.id;
        }
        else {
            const authors = await (0, firestore_helpers_1.executeQuery)('authors', [{ field: 'user_id', op: '==', value: userId }]);
            if (authors.length > 0) {
                author = authors[0];
                authorId = author.id;
            }
        }
        if (!authorId) {
            // Create
            const newAuthor = {
                user_id: userId,
                display_name: updates.name || "",
                profile_photo_url: updates.photoUrl || "",
                tags: [], // Store as array in Firestore
                social_links: {},
                payout_details: {},
                created_at: new Date()
            };
            const created = await (0, firestore_helpers_1.createDoc)('authors', newAuthor, userId);
            authorId = created.id;
        }
        const updateFields = {};
        const fieldsMapping = {
            name: "display_name",
            location: "location",
            bio: "bio",
            legalName: "legal_name",
            qualifications: "qualifications",
            specialty: "specialty",
        };
        Object.keys(fieldsMapping).forEach((field) => {
            if (updates[field] !== undefined)
                updateFields[fieldsMapping[field]] = updates[field];
        });
        // Firestore stores JSON/Arrays natively, no stringify needed if we transition.
        // BUT legacy frontend might send objects.
        // The previous code STRINGIFIED them. 
        // Ideally we store as objects in Firestore.
        // Let's store as objects if they are objects, or string versions if we must maintain compatibility?
        // Firestore is flexible. Let's store as objects.
        if (updates.tags !== undefined)
            updateFields.tags = updates.tags;
        if (updates.socialLinks !== undefined)
            updateFields.social_links = updates.socialLinks;
        if (updates.payoutDetails !== undefined)
            updateFields.payout_details = updates.payoutDetails;
        if (updates.photoUrl !== undefined)
            updateFields.profile_photo_url = updates.photoUrl;
        if (authorId && Object.keys(updateFields).length > 0) {
            await (0, firestore_helpers_1.updateDoc)('authors', authorId, updateFields);
            logger_1.logger.info(`Author profile updated for user ${userId}`);
        }
        res.json({ success: true, message: "Profile updated successfully" });
    }
    catch (error) {
        logger_1.logger.error("Error updating author profile:", error instanceof Error ? error.message : error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateAuthorProfile = updateAuthorProfile;
const updateProfilePhoto = async (req, res) => {
    try {
        let userId = extractUserIdFromRequest(req);
        const { photoUrl } = req.body || {};
        if (!userId) {
            if (process.env.ALLOW_GUEST_PROFILE === "true") {
                res.json({ success: true, message: "Guest photo update ignored in dev.", photoUrl });
                return;
            }
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!photoUrl) {
            res.status(400).json({ error: "Photo URL is required" });
            return;
        }
        let authorId = null;
        let author = await (0, firestore_helpers_1.getDoc)('authors', userId);
        if (author) {
            await (0, firestore_helpers_1.updateDoc)('authors', author.id, { profile_photo_url: photoUrl });
        }
        else {
            const authors = await (0, firestore_helpers_1.executeQuery)('authors', [{ field: 'user_id', op: '==', value: userId }]);
            if (authors.length > 0) {
                await (0, firestore_helpers_1.updateDoc)('authors', authors[0].id, { profile_photo_url: photoUrl });
            }
            else {
                // Create
                await (0, firestore_helpers_1.createDoc)('authors', {
                    user_id: userId,
                    display_name: "",
                    profile_photo_url: photoUrl,
                    created_at: new Date()
                }, userId);
            }
        }
        res.json({ success: true, message: "Profile photo updated", photoUrl });
    }
    catch (error) {
        logger_1.logger.error("Error updating profile photo:", error instanceof Error ? error.message : error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateProfilePhoto = updateProfilePhoto;
const updateAuthorStats = async (req, res) => {
    try {
        let userId = extractUserIdFromRequest(req);
        const { articles, views, certificates, earnings, monthlyEarnings, rank } = req.body || {};
        if (!userId) {
            if (process.env.ALLOW_GUEST_PROFILE === "true") {
                res.json({ success: true, message: "Guest stats update ignored in dev." });
                return;
            }
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // Upsert stats using userId as doc ID (or find by author_id if legacy)
        let statsDoc = await (0, firestore_helpers_1.getDoc)('author_stats', userId);
        // If not found by userId, try creation or query? 
        // We assume new stack uses userId.
        if (!statsDoc) {
            // Just create/set
            await (0, firestore_helpers_1.createDoc)('author_stats', {
                author_id: userId, // Link back to user/author
                articles_published: articles || 0,
                total_views: views || 0,
                certificates_earned: certificates || 0,
                total_earnings: earnings || 0,
                monthly_earnings: monthlyEarnings || 0,
                rank: rank || 0,
                updated_at: new Date()
            }, userId);
        }
        else {
            await (0, firestore_helpers_1.updateDoc)('author_stats', userId, {
                articles_published: articles !== undefined ? articles : statsDoc.articles_published,
                total_views: views !== undefined ? views : statsDoc.total_views,
                certificates_earned: certificates !== undefined ? certificates : statsDoc.certificates_earned,
                total_earnings: earnings !== undefined ? earnings : statsDoc.total_earnings,
                monthly_earnings: monthlyEarnings !== undefined ? monthlyEarnings : statsDoc.monthly_earnings,
                rank: rank !== undefined ? rank : statsDoc.rank,
                updated_at: new Date()
            });
        }
        res.json({ success: true, message: "Stats updated successfully" });
    }
    catch (error) {
        logger_1.logger.error("Error updating author stats:", error instanceof Error ? error.message : error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateAuthorStats = updateAuthorStats;
const getAuthorStats = async (req, res) => {
    try {
        let userId = extractUserIdFromRequest(req);
        if (!userId) {
            if (process.env.ALLOW_GUEST_PROFILE === "true") {
                res.json({
                    success: true,
                    stats: {
                        articles: 0,
                        views: 0,
                        certificates: 0,
                        earnings: 0,
                        monthlyEarnings: 0,
                        rank: 0,
                    },
                });
                return;
            }
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // Try finding stats
        let stats = await (0, firestore_helpers_1.getDoc)('author_stats', userId);
        if (!stats) {
            // Try query by author_id matching userId (legacy assumption: author_id might be user_id?)
            // Or author_id matches author doc ID which might NOT be userId in legacy.
            // Let's resolve Author doc first.
            let authorId = userId;
            const author = await (0, firestore_helpers_1.getDoc)('authors', userId);
            if (author)
                authorId = author.id;
            else {
                const authors = await (0, firestore_helpers_1.executeQuery)('authors', [{ field: 'user_id', op: '==', value: userId }]);
                if (authors.length > 0)
                    authorId = authors[0].id;
            }
            const s = await (0, firestore_helpers_1.executeQuery)('author_stats', [{ field: 'author_id', op: '==', value: authorId }]);
            if (s.length > 0)
                stats = s[0];
        }
        if (!stats) {
            // Return zeros
            res.json({
                success: true,
                stats: {
                    articles: 0,
                    views: 0,
                    certificates: 0,
                    earnings: 0,
                    monthlyEarnings: 0,
                    rank: 0,
                },
            });
            return;
        }
        res.json({
            success: true,
            stats: {
                articles: stats.articles_published || 0,
                views: stats.total_views || 0,
                certificates: stats.certificates_earned || 0,
                earnings: stats.total_earnings || 0,
                monthlyEarnings: stats.monthly_earnings || 0,
                rank: stats.rank || stats.author_rank || 0,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching author stats:", error instanceof Error ? error.message : error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAuthorStats = getAuthorStats;
const getSubscriptionPlans = async (req, res) => {
    try {
        // Determine sort order manually or if executeQuery supports it.
        // executeQuery(collection, filters, limit, orderBy)
        const plans = await (0, firestore_helpers_1.executeQuery)('subscription_plans', [], undefined, { field: 'price_monthly', dir: 'asc' });
        const formattedPlans = plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            priceMonthly: plan.price_monthly,
            priceYearly: plan.price_yearly,
            features: plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [],
            duration: plan.duration,
        }));
        res.json({ success: true, plans: formattedPlans });
    }
    catch (error) {
        logger_1.logger.error("Error fetching subscription plans:", error instanceof Error ? error.message : error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getSubscriptionPlans = getSubscriptionPlans;
const getCurrentSubscription = async (req, res) => {
    try {
        let userId = extractUserIdFromRequest(req);
        if (!userId) {
            if (process.env.ALLOW_GUEST_PROFILE === "true") {
                res.json({
                    success: true,
                    subscription: {
                        planId: null,
                        planName: "Free Plan",
                        priceMonthly: 0,
                        priceYearly: 0,
                        status: "free",
                        features: [],
                    },
                    hasActiveSubscription: false,
                });
                return;
            }
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const subscription = await (0, exports.getCurrentSubscriptionInternal)(userId);
        res.json({
            success: true,
            subscription,
            hasActiveSubscription: subscription && subscription.status !== "free",
        });
    }
    catch (error) {
        logger_1.logger.error("Error fetching current subscription:", error instanceof Error ? error.message : error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getCurrentSubscription = getCurrentSubscription;
const getCurrentSubscriptionInternal = async (userId) => {
    try {
        // Filter by user_id, status=active, end_date > now
        // Firestore complex filter: end_date > now.
        // Must parse dates. Firestore dates are Timestamp or Date.
        // Note: Firestore comparisons need consistent types.
        // For now, let's fetch active subscriptions for user and filter in memory if needed (or verify exact filter).
        const subscriptions = await (0, firestore_helpers_1.executeQuery)('user_subscriptions', [
            { field: 'user_id', op: '==', value: userId },
            { field: 'status', op: '==', value: 'active' }
        ]);
        // Sort by end_date desc
        subscriptions.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
        const validSubs = subscriptions.filter((s) => new Date(s.end_date) > new Date());
        if (validSubs.length > 0) {
            const sub = validSubs[0];
            // Fetch plan details
            const plan = await (0, firestore_helpers_1.getDoc)('subscription_plans', sub.plan_id);
            return {
                id: sub.id,
                planId: sub.plan_id,
                planName: plan ? plan.name : 'Unknown Plan',
                priceMonthly: sub.amount || (plan ? plan.price_monthly : 0),
                priceYearly: plan ? plan.price_yearly : 0,
                startDate: sub.start_date,
                endDate: sub.end_date,
                status: sub.status,
                features: plan && plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [],
            };
        }
        else {
            // Free plan
            const plans = await (0, firestore_helpers_1.executeQuery)('subscription_plans', [{ field: 'name', op: '==', value: 'Free Plan' }]);
            if (plans.length > 0) {
                const freePlan = plans[0];
                return {
                    planId: freePlan.id,
                    planName: freePlan.name,
                    priceMonthly: 0,
                    priceYearly: 0,
                    status: "free",
                    features: freePlan.features ? (typeof freePlan.features === 'string' ? JSON.parse(freePlan.features) : freePlan.features) : [],
                };
            }
            return null;
        }
    }
    catch (error) {
        logger_1.logger.error("Error in getCurrentSubscriptionInternal:", error instanceof Error ? error.message : error);
        return null;
    }
};
exports.getCurrentSubscriptionInternal = getCurrentSubscriptionInternal;
const incrementArticleCount = async (userId) => {
    try {
        // Resolve author stats doc needed?
        // We try direct access author_stats/{userId}
        let stats = await (0, firestore_helpers_1.getDoc)('author_stats', userId);
        if (!stats) {
            // Try querying by author_id
            let authorId = userId; // Assume same
            // Logic to resolve Author ID omitted for brevity, assume direct or we create new
            // If we don't find stats, we create for userId
            stats = { articles_published: 0, total_earnings: 0 };
            await (0, firestore_helpers_1.createDoc)('author_stats', {
                author_id: userId,
                articles_published: 1,
                updated_at: new Date()
            }, userId);
        }
        else {
            await (0, firestore_helpers_1.updateDoc)('author_stats', stats.id, {
                articles_published: (stats.articles_published || 0) + 1
            });
        }
    }
    catch (error) {
        logger_1.logger.error("Error incrementing article count:", error instanceof Error ? error.message : error);
    }
};
exports.incrementArticleCount = incrementArticleCount;
const incrementViews = async (userId, views = 1) => {
    try {
        let stats = await (0, firestore_helpers_1.getDoc)('author_stats', userId);
        if (!stats) {
            await (0, firestore_helpers_1.createDoc)('author_stats', {
                author_id: userId,
                total_views: views,
                articles_published: 0,
                updated_at: new Date()
            }, userId);
        }
        else {
            await (0, firestore_helpers_1.updateDoc)('author_stats', stats.id, {
                total_views: (stats.total_views || 0) + views
            });
        }
    }
    catch (error) {
        logger_1.logger.error("Error incrementing views:", error instanceof Error ? error.message : error);
    }
};
exports.incrementViews = incrementViews;
const addEarnings = async (userId, amount) => {
    try {
        let stats = await (0, firestore_helpers_1.getDoc)('author_stats', userId);
        if (!stats) {
            await (0, firestore_helpers_1.createDoc)('author_stats', {
                author_id: userId,
                total_earnings: amount,
                monthly_earnings: amount,
                articles_published: 0,
                updated_at: new Date()
            }, userId);
        }
        else {
            await (0, firestore_helpers_1.updateDoc)('author_stats', stats.id, {
                total_earnings: (stats.total_earnings || 0) + amount,
                monthly_earnings: (stats.monthly_earnings || 0) + amount
            });
        }
    }
    catch (error) {
        logger_1.logger.error("Error adding earnings:", error instanceof Error ? error.message : error);
    }
};
exports.addEarnings = addEarnings;
const getTopAuthors = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const authors = await getTopAuthorsInternal(limit);
        res.json({ success: true, authors });
    }
    catch (error) {
        logger_1.logger.error("Error getting top authors:", error instanceof Error ? error.message : error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getTopAuthors = getTopAuthors;
const getTopAuthorsInternal = async (limit = 10) => {
    try {
        // 1. Get stats sorted by total_earnings (or articles)
        // executeQuery(col, filters, limit, order)
        const stats = await (0, firestore_helpers_1.executeQuery)('author_stats', [], limit, { field: 'total_earnings', dir: 'desc' });
        // 2. Map authors
        // Manual join
        const results = [];
        // Optimisation: Fetch all authors in parallel?
        // stats has author_id (which could be userId or docId).
        // existing logic uses it to join.
        // We assume stats.author_id points to 'authors' doc ID OR 'users' ID.
        // Let's assume 'authors' doc ID.
        for (const statItem of stats) {
            const stat = statItem;
            // stat.author_id
            if (!stat.author_id)
                continue;
            let author = await (0, firestore_helpers_1.getDoc)('authors', stat.author_id);
            if (!author) {
                // Maybe author_id was user_id, check author where user_id = stat.author_id
                const matches = await (0, firestore_helpers_1.executeQuery)('authors', [{ field: 'user_id', op: '==', value: stat.author_id }]);
                if (matches.length > 0)
                    author = matches[0];
            }
            if (author && (author.is_verified === true || author.is_verified === 'true')) {
                results.push({
                    display_name: author.display_name,
                    profile_photo_url: author.profile_photo_url,
                    specialty: author.specialty,
                    total_earnings: stat.total_earnings,
                    articles_published: stat.articles_published,
                    total_views: stat.total_views,
                    rank: stat.rank
                });
            }
        }
        return results;
    }
    catch (error) {
        logger_1.logger.error("Error getting top authors:", error instanceof Error ? error.message : error);
        return [];
    }
};
//# sourceMappingURL=author.controller.js.map