"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = exports.getAdvancedAnalytics = exports.updateSystemSettings = exports.getSystemSettings = exports.createAnnouncement = exports.updateIncident = exports.createIncident = exports.getIncidents = exports.getAuditLogs = exports.verifyPlagiarismReport = exports.getPlagiarismMonitor = exports.adminContentAction = exports.getAllContent = exports.createUser = exports.manageUserRole = exports.getSystemUsers = exports.getPlatformHealth = exports.resetPassword = exports.forgotPassword = exports.verifyAdmin = exports.createAdmin = exports.adminLogin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
// import { getDatabase } from '../config/database';
const logger_1 = require("../utils/logger");
const nodemailer_1 = __importDefault(require("nodemailer"));
const mailer_1 = require("../utils/mailer");
const firestore_helpers_1 = require("../utils/firestore-helpers");
// Helper for JWT signing
const safeSign = (payload, secretOrPrivateKey, options) => {
    var _a, _b, _c, _d;
    let signFn = (_a = jwt.sign) !== null && _a !== void 0 ? _a : (_b = jwt.default) === null || _b === void 0 ? void 0 : _b.sign;
    if (typeof signFn !== 'function') {
        try {
            const requiredJwt = require('jsonwebtoken');
            signFn = (_c = requiredJwt === null || requiredJwt === void 0 ? void 0 : requiredJwt.sign) !== null && _c !== void 0 ? _c : (_d = requiredJwt === null || requiredJwt === void 0 ? void 0 : requiredJwt.default) === null || _d === void 0 ? void 0 : _d.sign;
        }
        catch (reqErr) { }
    }
    return signFn ? signFn(payload, secretOrPrivateKey, options) : '';
};
// Generate random OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const createTransporter = () => {
    return nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};
// Helper to log admin actions
const logAdminAction = async (adminId, action, targetType, targetId, details, ip = '') => {
    try {
        await (0, firestore_helpers_1.createDoc)('admin_audit_logs', {
            admin_id: adminId,
            action,
            target_type: targetType,
            target_id: targetId,
            details: details, // Firestore handles objects
            ip_address: ip,
            created_at: new Date()
        });
    }
    catch (err) {
        console.error('Failed to log admin action:', err);
    }
};
/* -------------------------------------------------------------------------- */
/*                                AUTHENTICATION                              */
/* -------------------------------------------------------------------------- */
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'email', op: '==', value: email }]);
        if (users.length === 0) {
            res.status(401).json({ status: 'error', message: 'Invalid credentials' });
            return;
        }
        const user = users[0];
        if (user.role !== 'admin') {
            res.status(403).json({ status: 'error', message: 'Unauthorized access. Admin privileges required.' });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ status: 'error', message: 'Invalid credentials' });
            return;
        }
        const token = safeSign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });
        res.status(200).json({
            status: 'success',
            message: 'Admin login successful',
            data: {
                token,
                user: { id: user.id, email: user.email, name: user.name, role: user.role }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Admin login error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.adminLogin = adminLogin;
const createAdmin = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUsers = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'email', op: '==', value: email }]);
        if (existingUsers.length > 0) {
            res.status(409).json({ status: 'error', message: 'User already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        await (0, firestore_helpers_1.createDoc)('users', {
            email,
            password: hashedPassword,
            name: name || 'Admin User',
            role: 'admin',
            is_email_verified: false,
            created_at: new Date()
        });
        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        // Use Firestore for OTPs
        await (0, firestore_helpers_1.createDoc)('admin_otps', {
            email,
            otp,
            expires_at: new Date(expiresAt),
            created_at: new Date()
        });
        try {
            const transporter = createTransporter();
            await transporter.sendMail({
                from: `"MindRadix Team" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Verify Admin Account - MindRadix',
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Verify Admin Access</h2>
                    <p>An admin account creation was requested with your email.</p>
                    <p>Your OTP is: <strong>${otp}</strong></p>
                    <p>If this wasn't you, please contact support immediately.</p>
                  </div>
                `
            });
            res.status(201).json({
                status: 'success',
                message: 'Admin account created. Please verify OTP sent to email.',
                data: { email, requiresVerification: true }
            });
        }
        catch (emailErr) {
            logger_1.logger.error('Failed to send admin OTP', emailErr);
            res.status(201).json({
                status: 'success',
                message: 'Admin account created but email failed. Contact support.',
                data: { email, requiresVerification: true }
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Create admin error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.createAdmin = createAdmin;
const verifyAdmin = async (req, res) => {
    var _a;
    try {
        const { email, otp } = req.body;
        // Check OTP in Firestore
        // Get latest OTP for email
        // Check if OTP exists and is valid
        const otps = await (0, firestore_helpers_1.executeQuery)('admin_otps', [{ field: 'email', op: '==', value: email }]);
        // Sort to get latest
        otps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const latestOtp = otps.length > 0 ? otps[0] : null;
        if (!latestOtp || latestOtp.otp !== otp) {
            res.status(400).json({ status: 'error', message: 'Invalid OTP' });
            return;
        }
        const expires = ((_a = latestOtp.expires_at) === null || _a === void 0 ? void 0 : _a.toDate) ? latestOtp.expires_at.toDate().getTime() : new Date(latestOtp.expires_at).getTime();
        if (Date.now() > expires) {
            res.status(400).json({ status: 'error', message: 'OTP expired' });
            return;
        }
        // OTP Valid. Remove it
        await (0, firestore_helpers_1.deleteDoc)('admin_otps', latestOtp.id);
        // Update User
        const users = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'email', op: '==', value: email }]);
        if (users.length > 0) {
            const user = users[0];
            // Update admin verified status if needed
            if (!user.is_email_verified) {
                await (0, firestore_helpers_1.updateDoc)('users', user.id, { is_email_verified: true });
            }
        }
        res.status(200).json({ status: 'success', message: 'Admin verified successfully. You may now login.' });
    }
    catch (error) {
        logger_1.logger.error('Verify admin error:', error);
        res.status(500).json({ status: 'error', message: 'Verification failed' });
    }
};
exports.verifyAdmin = verifyAdmin;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const users = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'email', op: '==', value: email }]);
        if (users.length === 0) {
            // Return success even if not found to prevent enumeration, or return 404 if internal policy allows
            res.status(200).json({ status: 'success', message: 'If an account exists, an OTP has been sent.' });
            return;
        }
        const user = users[0];
        if (user.role !== 'admin') {
            res.status(200).json({ status: 'success', message: 'If an account exists, an OTP has been sent.' });
            return;
        }
        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
        await (0, firestore_helpers_1.createDoc)('admin_otps', {
            email,
            otp,
            expires_at: new Date(expiresAt),
            created_at: new Date()
        });
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"MindRadix Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Admin Password - MindRadix',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your admin password.</p>
                <p>Your OTP is: <strong>${otp}</strong></p>
                <p>It expires in 10 minutes.</p>
              </div>
            `
        });
        res.status(200).json({ status: 'success', message: 'OTP sent successfully.' });
    }
    catch (error) {
        logger_1.logger.error('Forgot password error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process request' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    var _a;
    try {
        const { email, otp, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' });
            return;
        }
        const otps = await (0, firestore_helpers_1.executeQuery)('admin_otps', [{ field: 'email', op: '==', value: email }]);
        otps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const latestOtp = otps.length > 0 ? otps[0] : null;
        if (!latestOtp || latestOtp.otp !== otp) {
            res.status(400).json({ status: 'error', message: 'Invalid OTP' });
            return;
        }
        const expires = ((_a = latestOtp.expires_at) === null || _a === void 0 ? void 0 : _a.toDate) ? latestOtp.expires_at.toDate().getTime() : new Date(latestOtp.expires_at).getTime();
        if (Date.now() > expires) {
            res.status(400).json({ status: 'error', message: 'OTP expired' });
            return;
        }
        // OTP Valid
        const users = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'email', op: '==', value: email }]);
        if (users.length === 0) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }
        const user = users[0];
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await (0, firestore_helpers_1.updateDoc)('users', user.id, { password: hashedPassword });
        // Clean up OTP
        await (0, firestore_helpers_1.deleteDoc)('admin_otps', latestOtp.id);
        await logAdminAction(user.id, 'RESET_PASSWORD', 'user', user.id, {});
        res.status(200).json({ status: 'success', message: 'Password reset successfully. Please login.' });
    }
    catch (error) {
        logger_1.logger.error('Reset password error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to reset password' });
    }
};
exports.resetPassword = resetPassword;
/* -------------------------------------------------------------------------- */
/*                                DASHBOARD APIS                              */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                                DASHBOARD APIS                              */
/* -------------------------------------------------------------------------- */
const getPlatformHealth = async (req, res) => {
    try {
        // Fetch all users (only needed fields for stats ideally, but helper fetches all)
        // Optimization: Create a specific aggregation collection or cloud function counter.
        // For migration: Fetch all users.
        const users = await (0, firestore_helpers_1.executeQuery)('users');
        const totalUsers = users.length;
        const readers = users.filter((u) => u.role === 'reader').length;
        const authors = users.filter((u) => u.role === 'author').length;
        const reviewers = users.filter((u) => u.role === 'reviewer').length;
        const editors = users.filter((u) => u.role === 'editor').length;
        const contentManagers = users.filter((u) => u.role === 'content_manager').length;
        const content = await (0, firestore_helpers_1.executeQuery)('content');
        const totalSubmissions = content.length;
        // Date checks in memory
        // Date checks in memory
        const today = new Date().toISOString().split('T')[0];
        const safeIso = (d) => {
            if (!d)
                return null;
            try {
                const date = d.toDate ? d.toDate() : new Date(d);
                if (isNaN(date.getTime()))
                    return null;
                return date.toISOString();
            }
            catch (e) {
                return null;
            }
        };
        const submissionsToday = content.filter((c) => {
            const iso = safeIso(c.created_at);
            return iso && iso.startsWith(today);
        }).length;
        const pendingReviews = content.filter((c) => c.status === 'submitted').length;
        const inReview = content.filter((c) => c.status === 'under_review').length;
        const publishedToday = content.filter((c) => {
            const iso = safeIso(c.updated_at);
            return c.status === 'published' && iso && iso.startsWith(today);
        }).length;
        // Editor Queue
        // assignments status in assigned/in_progress. Distinct article_id.
        const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
            { field: 'status', op: 'in', value: ['assigned', 'in_progress'] } // helper assumes 'op' handled (custom helper supports 'in'?)
            // If helper calls underlying firestore 'in', good.
        ]);
        // If helper does NOT support 'in', we fetch all or multiple queries.
        // Assuming helper pass-through. If not supported, we might get error.
        // Fallback: Fetch all assignments? Or separate queries.
        // Let's assume helper handles 'in' or we fetch all and filter.
        // Since my previous helper code showed `conditions` array, and Firestore `where` supports `in`.
        // BUT my helper signature: `op: WhereFilterOp`. Firestore `WhereFilterOp` includes 'in'.
        // So it should work.
        const activeEditorArticles = new Set(assignments.map((a) => a.article_id)).size;
        const activeSessions = Math.floor(totalUsers * 0.15);
        res.status(200).json({
            status: 'success',
            data: {
                users: {
                    total: totalUsers,
                    readers,
                    authors,
                    reviewers,
                    editors,
                    content_managers: contentManagers
                },
                sessions: { active: activeSessions, daily_active: Math.floor(totalUsers * 0.3) },
                content: {
                    total_submissions: totalSubmissions,
                    submissions_today: submissionsToday,
                    pending_reviews: pendingReviews,
                    in_review: inReview,
                    published_today: publishedToday,
                    editor_queue: activeEditorArticles
                },
                alerts: 0,
                system_status: 'operational'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get platform health error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch platform health' });
    }
};
exports.getPlatformHealth = getPlatformHealth;
const getSystemUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        // Fetch ALL users then filter/slice (In-Memory Pagination)
        let users = await (0, firestore_helpers_1.executeQuery)('users');
        // Filter
        if (role && role !== 'all') {
            users = users.filter((u) => u.role === role);
        }
        if (search) {
            const s = search.toLowerCase();
            users = users.filter((u) => (u.name && u.name.toLowerCase().includes(s)) ||
                (u.email && u.email.toLowerCase().includes(s)));
        }
        // Sort
        users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Pagination
        const total = users.length;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedUsers = users.slice(startIndex, endIndex);
        res.status(200).json({
            status: 'success',
            data: {
                users: paginatedUsers.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    created_at: u.created_at,
                    is_email_verified: u.is_email_verified
                })),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get system users error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
    }
};
exports.getSystemUsers = getSystemUsers;
const manageUserRole = async (req, res) => {
    var _a;
    try {
        const { userId, newRole, action } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (action === 'update_role') {
            await (0, firestore_helpers_1.updateDoc)('users', userId, { role: newRole });
            await logAdminAction(adminId, 'UPDATE_ROLE', 'user', userId, { new_role: newRole });
        }
        else if (action === 'suspend') {
            const user = await (0, firestore_helpers_1.getDoc)('users', userId);
            if (user) {
                let profile = user.profile_data || {};
                profile.suspended = true;
                await (0, firestore_helpers_1.updateDoc)('users', userId, { profile_data: profile });
            }
            await logAdminAction(adminId, 'SUSPEND_USER', 'user', userId, {});
        }
        else if (action === 'activate') {
            const user = await (0, firestore_helpers_1.getDoc)('users', userId);
            if (user) {
                let profile = user.profile_data || {};
                delete profile.suspended;
                await (0, firestore_helpers_1.updateDoc)('users', userId, { profile_data: profile });
            }
            await logAdminAction(adminId, 'ACTIVATE_USER', 'user', userId, {});
        }
        res.status(200).json({ status: 'success', message: `User action ${action} completed` });
    }
    catch (error) {
        logger_1.logger.error('Manage user error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update user' });
    }
};
exports.manageUserRole = manageUserRole;
const createUser = async (req, res) => {
    var _a;
    try {
        const { name, email, password, role } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // Basic validation
        if (!email || !password || !name) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }
        const existing = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'email', op: '==', value: email }]);
        if (existing.length > 0) {
            res.status(409).json({ status: 'error', message: 'User with this email already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const validRoles = ['reader', 'author', 'reviewer', 'editor', 'content_manager', 'admin'];
        const userRole = validRoles.includes(role) ? role : 'reader';
        // Auto-generate ID or let Firestore do it?
        // createDoc with data usually lets Firestore generate ID if not provided.
        // But we need the ID for logging.
        // We can create doc reference first? Or createDoc returns the creating logic result (usually ID)?
        // My helper createDoc signature: `createDoc(collection, data, id?)`. Returns `Promise<string>`.
        const newUserId = await (0, firestore_helpers_1.createDoc)('users', {
            email,
            password: hashedPassword,
            name,
            role: userRole,
            is_email_verified: true,
            created_at: new Date(),
            profile_data: {}
        });
        await logAdminAction(adminId, 'CREATE_USER', 'user', newUserId, { name, email, role: userRole });
        res.status(201).json({ status: 'success', message: 'User created successfully' });
    }
    catch (error) {
        logger_1.logger.error('Create user error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create user' });
    }
};
exports.createUser = createUser;
const getAllContent = async (req, res) => {
    try {
        const { status, search, category, page = 1, limit = 20 } = req.query;
        // Fetch content
        // Firestore filter by status directly if possible
        let content = [];
        if (status && status !== 'all') {
            content = await (0, firestore_helpers_1.executeQuery)('content', [{ field: 'status', op: '==', value: status }]);
        }
        else {
            content = await (0, firestore_helpers_1.executeQuery)('content');
        }
        // Filter by category name (requires fetching categories to map Name -> ID? or fetching article then cat?)
        // Article references category_id. The filter calls for category NAME.
        // We either fetch all CAtegories to find ID, or fetch articles and then filter by joined category name.
        // Fetch authors and categories in parallel or lazy load?
        // Let's fetch all users (authors) and categories for join map if dataset small.
        // Or fetch per item (N+1).
        // Optimization: Fetch unique Author IDs from content list.
        const authorIds = [...new Set(content.map((c) => c.author_id))];
        const categoryIds = [...new Set(content.map((c) => c.category_id))].filter(Boolean);
        // Fetch authors
        // executeQuery with 'in' (limit 10) or Promise.all(getDoc).
        // Promise.all is robust.
        const authorMap = new Map();
        await Promise.all(authorIds.map(async (uid) => {
            if (!uid)
                return;
            const u = await (0, firestore_helpers_1.getDoc)('users', uid);
            if (u)
                authorMap.set(uid, u.name);
        }));
        const categoryMap = new Map();
        await Promise.all(categoryIds.map(async (cid) => {
            if (!cid)
                return;
            const c = await (0, firestore_helpers_1.getDoc)('categories', cid);
            if (c)
                categoryMap.set(cid, c.name);
        }));
        // Get Plagiarism Reports (Latest per article)
        // Optimization: Fetch all reports for these article IDs? Or one by one.
        const plagiarismMap = new Map();
        await Promise.all(content.map(async (c) => {
            const reports = await (0, firestore_helpers_1.executeQuery)('plagiarism_reports', [{ field: 'article_id', op: '==', value: c.id }]);
            // Sort to get latest
            reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            if (reports.length > 0) {
                plagiarismMap.set(c.id, reports[0]);
            }
        }));
        // Map data
        let formattedContent = content.map((c) => {
            var _a, _b;
            return ({
                id: c.id,
                title: c.title,
                status: c.status,
                created_at: c.created_at,
                author: authorMap.get(c.author_id) || 'Unknown',
                category: categoryMap.get(c.category_id) || 'Uncategorized',
                plagiarism_status: ((_a = plagiarismMap.get(c.id)) === null || _a === void 0 ? void 0 : _a.status) || null,
                plagiarism_score: ((_b = plagiarismMap.get(c.id)) === null || _b === void 0 ? void 0 : _b.similarity_summary)
                    ? (typeof plagiarismMap.get(c.id).similarity_summary === 'string'
                        ? JSON.parse(plagiarismMap.get(c.id).similarity_summary)
                        : plagiarismMap.get(c.id).similarity_summary)
                    : null
            });
        });
        // Apply remaining filters (Search, Category matches)
        if (category && category !== 'all') {
            formattedContent = formattedContent.filter((c) => c.category === category);
        }
        if (search) {
            const s = search.toLowerCase();
            formattedContent = formattedContent.filter((c) => (c.title && c.title.toLowerCase().includes(s)) ||
                (c.author && c.author.toLowerCase().includes(s)));
        }
        // Sort
        formattedContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Pagination
        const total = formattedContent.length;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginated = formattedContent.slice(startIndex, endIndex);
        res.status(200).json({
            status: 'success',
            data: {
                content: paginated,
                pagination: {
                    total: total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get all content error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch content' });
    }
};
exports.getAllContent = getAllContent;
const adminContentAction = async (req, res) => {
    var _a;
    try {
        const { articleId, action, notes } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (action === 'approve') {
            await (0, firestore_helpers_1.updateDoc)('content', articleId, { status: 'approved' });
            await logAdminAction(adminId, 'APPROVE_CONTENT', 'article', articleId, { notes });
        }
        else if (action === 'reject') {
            await (0, firestore_helpers_1.updateDoc)('content', articleId, { status: 'rejected' });
            await logAdminAction(adminId, 'REJECT_CONTENT', 'article', articleId, { notes });
        }
        else if (action === 'takedown') {
            await (0, firestore_helpers_1.updateDoc)('content', articleId, { status: 'rejected' }); // or 'takedown'
            await logAdminAction(adminId, 'TAKEDOWN_CONTENT', 'article', articleId, { notes });
        }
        else if (action === 'rescan') {
            await logAdminAction(adminId, 'FORCE_RESCAN', 'article', articleId, { notes });
            // Logic to trigger scan? usually separate service or just status reset?
            // Existing code only logged action. Keeping as is.
        }
        res.status(200).json({ status: 'success', message: `Content action ${action} completed` });
    }
    catch (error) {
        logger_1.logger.error('Admin content action error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to perform content action' });
    }
};
exports.adminContentAction = adminContentAction;
const getPlagiarismMonitor = async (req, res) => {
    try {
        const { status, timeframe, page = 1, limit = 20 } = req.query;
        // status: 'pending_check' or 'checked'
        const content = await (0, firestore_helpers_1.executeQuery)('content');
        let monitorData = await Promise.all(content.map(async (c) => {
            // Check reports
            const reports = await (0, firestore_helpers_1.executeQuery)('plagiarism_reports', [{ field: 'article_id', op: '==', value: c.id }]);
            reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const latestReport = reports.length > 0 ? reports[0] : null;
            const hasReport = !!latestReport;
            // Check reviewer assignment
            const assignments = await (0, firestore_helpers_1.executeQuery)('reviewer_assignments', [
                { field: 'article_id', op: '==', value: c.id }
            ]);
            // Filter assigned/completed
            const activeAssign = assignments.find((a) => ['assigned', 'completed'].includes(a.status));
            let authorName = 'Unknown';
            let reviewerName = null; // Explicitly type as string | null
            if (c.author_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', c.author_id);
                if (u)
                    authorName = u.name;
            }
            if (activeAssign && activeAssign.reviewer_id) {
                const r = await (0, firestore_helpers_1.getDoc)('users', activeAssign.reviewer_id);
                if (r)
                    reviewerName = r.name;
            }
            return {
                article_id: c.id,
                title: c.title,
                author_name: authorName,
                reviewer_id: activeAssign ? activeAssign.reviewer_id : null,
                reviewer_name: reviewerName,
                report_id: latestReport ? latestReport.id : null,
                similarity_summary: latestReport ? latestReport.similarity_summary : null,
                check_date: latestReport ? latestReport.created_at : null,
                run_by: latestReport ? latestReport.run_by : null,
                check_status: hasReport ? 'checked' : 'pending',
                updated_at: c.updated_at
            };
        }));
        // Filter
        if (status === 'pending_check') {
            monitorData = monitorData.filter((d) => d.check_status === 'pending');
        }
        else if (status === 'checked') {
            monitorData = monitorData.filter((d) => d.check_status === 'checked');
        }
        // Sort
        monitorData.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        // Pagination
        const total = monitorData.length;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginated = monitorData.slice(startIndex, endIndex);
        // Format similarity
        const formatted = paginated.map((r) => {
            let similarity = 0;
            if (r.similarity_summary) {
                const s = typeof r.similarity_summary === 'string' ? JSON.parse(r.similarity_summary) : r.similarity_summary;
                similarity = s.score || 0;
            }
            return Object.assign(Object.assign({}, r), { similarity_score: similarity, reviewer_ran_check: r.run_by === r.reviewer_id });
        });
        res.status(200).json({
            status: 'success',
            data: {
                monitor: formatted,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get plagiarism monitor error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch plagiarism monitor' });
    }
};
exports.getPlagiarismMonitor = getPlagiarismMonitor;
const verifyPlagiarismReport = async (req, res) => {
    var _a;
    try {
        const { reportId, action, notes } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (action === 'escalate') {
            const report = await (0, firestore_helpers_1.getDoc)('plagiarism_reports', reportId);
            if (report) {
                await (0, firestore_helpers_1.createDoc)('incidents', {
                    title: 'Plagiarism Escalation',
                    description: `Escalated by admin. Notes: ${notes}`,
                    status: 'open',
                    priority: 'high',
                    submission_id: report.article_id, // Fetch from report
                    reported_by: adminId,
                    created_at: new Date()
                });
            }
        }
        await logAdminAction(adminId, 'VERIFY_PLAGIARISM', 'report', reportId, { action, notes });
        res.status(200).json({ status: 'success', message: `Report ${action} processed` });
    }
    catch (error) {
        logger_1.logger.error('Verify plagiarism error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to notify' });
    }
};
exports.verifyPlagiarismReport = verifyPlagiarismReport;
const getAuditLogs = async (req, res) => {
    try {
        const { adminId, action, page = 1, limit = 50 } = req.query;
        let logs = [];
        const filters = [];
        if (adminId) {
            filters.push({ field: 'admin_id', op: '==', value: adminId });
        }
        if (action) {
            filters.push({ field: 'action', op: '==', value: action });
        }
        // executeQuery can handle multiple filters if they are equality checks on different fields
        // For more complex queries (e.g., range queries or OR conditions), in-memory filtering might be needed.
        // Assuming executeQuery can handle multiple '==' filters for now.
        logs = await (0, firestore_helpers_1.executeQuery)('admin_audit_logs', filters);
        // Sort by created_at descending first to ensure consistent pagination
        logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Fetch Admin Names
        const adminIds = [...new Set(logs.map((l) => l.admin_id).filter(Boolean))]; // Filter out null/undefined admin_id
        const adminMap = new Map();
        await Promise.all(adminIds.map(async (uid) => {
            const u = await (0, firestore_helpers_1.getDoc)('users', uid);
            if (u)
                adminMap.set(uid, u);
        }));
        // Format
        const formattedLogs = logs.map((l) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, l), { admin_name: ((_a = adminMap.get(l.admin_id)) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown', admin_email: ((_b = adminMap.get(l.admin_id)) === null || _b === void 0 ? void 0 : _b.email) || 'Unknown', details: typeof l.details === 'string' ? JSON.parse(l.details) : l.details }));
        });
        // Pagination
        const total = formattedLogs.length;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginated = formattedLogs.slice(startIndex, endIndex);
        res.status(200).json({
            status: 'success',
            data: {
                logs: paginated,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get audit logs error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch logs' });
    }
};
exports.getAuditLogs = getAuditLogs;
/* -------------------------------------------------------------------------- */
/*                            INCIDENT MANAGEMENT                             */
/* -------------------------------------------------------------------------- */
const getIncidents = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;
        // Fetch incidents
        let incidents = await (0, firestore_helpers_1.executeQuery)('incidents');
        // Filters
        if (status && status !== 'all') {
            incidents = incidents.filter((i) => i.status === status);
        }
        if (priority && priority !== 'all') {
            incidents = incidents.filter((i) => i.priority === priority);
        }
        // Sort by created_at descending first to ensure consistent pagination
        incidents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Fetch Reporters & Assignees
        const userIds = new Set();
        incidents.forEach((i) => {
            if (i.reported_by)
                userIds.add(i.reported_by);
            if (i.assigned_to)
                userIds.add(i.assigned_to);
        });
        const userMap = new Map();
        await Promise.all(Array.from(userIds).map(async (uid) => {
            const u = await (0, firestore_helpers_1.getDoc)('users', uid);
            if (u)
                userMap.set(uid, u.name);
        }));
        const formattedIncidents = incidents.map((i) => (Object.assign(Object.assign({}, i), { reporter_name: userMap.get(i.reported_by) || 'Unknown', assignee_name: userMap.get(i.assigned_to) || null })));
        // Pagination
        const total = formattedIncidents.length;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginated = formattedIncidents.slice(startIndex, endIndex);
        res.status(200).json({
            status: 'success',
            data: {
                incidents: paginated,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get incidents error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch incidents' });
    }
};
exports.getIncidents = getIncidents;
const createIncident = async (req, res) => {
    var _a;
    try {
        const { title, description, priority, relatedSubmissionId } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        await (0, firestore_helpers_1.createDoc)('incidents', {
            title,
            description,
            priority: priority || 'medium',
            status: 'open',
            submission_id: relatedSubmissionId || null,
            reported_by: adminId,
            created_at: new Date()
        });
        await logAdminAction(adminId, 'CREATE_INCIDENT', 'incident', 'new', { title });
        res.status(201).json({ status: 'success', message: 'Incident created successfully' });
    }
    catch (error) {
        logger_1.logger.error('Create incident error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create incident' });
    }
};
exports.createIncident = createIncident;
const updateIncident = async (req, res) => {
    var _a;
    try {
        const { incidentId, status, priority, assignedTo, notes } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const updates = { updated_at: new Date() };
        if (status)
            updates.status = status;
        if (priority)
            updates.priority = priority;
        if (assignedTo)
            updates.assigned_to = assignedTo;
        if (notes)
            updates.resolution_notes = notes;
        await (0, firestore_helpers_1.updateDoc)('incidents', incidentId, updates);
        await logAdminAction(adminId, 'UPDATE_INCIDENT', 'incident', incidentId, { status, priority, assignedTo });
        res.status(200).json({ status: 'success', message: 'Incident updated' });
    }
    catch (error) {
        logger_1.logger.error('Update incident error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update incident' });
    }
};
exports.updateIncident = updateIncident;
// Helper for promise all check
const Promise_allCheck = async (promises) => {
    return Promise.allSettled(promises);
};
const createAnnouncement = async (req, res) => {
    var _a;
    try {
        const { title, message, targetRole } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // 1. Log in communications (Broadcast record)
        await (0, firestore_helpers_1.createDoc)('communications', {
            sender_id: adminId,
            receiver_id: targetRole || 'all',
            message: { title, body: message }, // Store as object
            type: 'system',
            entity_type: 'announcement',
            entity_id: null,
            is_read: false,
            created_at: new Date()
        });
        // 2. Fetch recipients
        let recipients = [];
        if (targetRole && targetRole !== 'all') {
            recipients = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'role', op: '==', value: targetRole }]);
        }
        else {
            // Original logic: if targetRole is 'all' or not specified, default to 'author'
            recipients = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'role', op: '==', value: 'author' }]);
        }
        if (recipients.length > 0) {
            // 3. Send Emails (Batch / Loop)
            const emailPromises = recipients.map((user) => (0, mailer_1.sendEmail)(user.email, `📢 Announcement: ${title}`, `<div style="font-family: Arial;">
                        <h2>${title}</h2>
                        <p>Dear ${user.name},</p>
                        <p>${message}</p>
                        <br/>
                        <p>Best regards,<br/>MindRadix Team</p>
                    </div>`));
            // 4. Create In-App Notifications
            const notifPromises = recipients.map((user) => (0, firestore_helpers_1.createDoc)('notifications', {
                user_id: user.id,
                type: 'announcement',
                title,
                message,
                link: '/dashboard',
                is_read: false,
                created_at: new Date()
            }));
            await Promise_allCheck([...emailPromises, ...notifPromises]);
        }
        await logAdminAction(adminId, 'CREATE_ANNOUNCEMENT', 'system', 'broadcast', { title, target: targetRole });
        res.status(200).json({ status: 'success', message: 'Announcement sent successfully', recipientCount: recipients.length });
    }
    catch (error) {
        logger_1.logger.error('Create announcement error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send announcement' });
    }
};
exports.createAnnouncement = createAnnouncement;
/* -------------------------------------------------------------------------- */
/*                              SYSTEM SETTINGS                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                              SYSTEM SETTINGS                               */
/* -------------------------------------------------------------------------- */
const getSystemSettings = async (req, res) => {
    try {
        const settingsDocs = await (0, firestore_helpers_1.executeQuery)('system_settings');
        const config = settingsDocs.length > 0 ? settingsDocs[0] : {};
        if (config.id)
            delete config.id;
        res.status(200).json({ status: 'success', data: config });
    }
    catch (error) {
        logger_1.logger.error('Get system settings error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
    }
};
exports.getSystemSettings = getSystemSettings;
const updateSystemSettings = async (req, res) => {
    var _a;
    try {
        const { settings } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const existing = await (0, firestore_helpers_1.executeQuery)('system_settings');
        if (existing.length > 0) {
            await (0, firestore_helpers_1.updateDoc)('system_settings', existing[0].id, settings);
        }
        else {
            await (0, firestore_helpers_1.createDoc)('system_settings', settings);
        }
        await logAdminAction(adminId, 'UPDATE_SETTINGS', 'system', 'settings', { keys: Object.keys(settings) });
        res.status(200).json({ status: 'success', message: 'Settings updated successfully' });
    }
    catch (error) {
        logger_1.logger.error('Update system settings error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update settings' });
    }
};
exports.updateSystemSettings = updateSystemSettings;
/* -------------------------------------------------------------------------- */
/*                              ADVANCED ANALYTICS                            */
/* -------------------------------------------------------------------------- */
const getAdvancedAnalytics = async (req, res) => {
    try {
        // Placeholder for complex analytics
        // Firestore aggregation queries can be used here later.
        res.status(200).json({
            status: 'success',
            data: {
                message: 'Advanced Analytics not fully migrated to Firestore yet.',
                contentVelocity: [],
                editorPerformance: [],
                reviewerStats: []
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Analytics error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch analytics' });
    }
};
exports.getAdvancedAnalytics = getAdvancedAnalytics;
const getAdminStats = async (req, res) => {
    return (0, exports.getPlatformHealth)(req, res);
};
exports.getAdminStats = getAdminStats;
//# sourceMappingURL=admin.controller.js.map