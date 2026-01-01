import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
// import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';
import { sendEmail } from '../utils/mailer';
import { executeQuery, getDoc, createDoc, updateDoc, deleteDoc, getCollection, getCount } from '../utils/firestore-helpers';

// Helper for JWT signing
const safeSign = (payload: object | string | Buffer, secretOrPrivateKey: jwt.Secret, options?: jwt.SignOptions): string => {
    let signFn: Function | undefined = (jwt as any).sign ?? (jwt as any).default?.sign;
    if (typeof signFn !== 'function') {
        try {
            const requiredJwt = require('jsonwebtoken');
            signFn = requiredJwt?.sign ?? requiredJwt?.default?.sign;
        } catch (reqErr) { }
    }
    return signFn ? signFn(payload, secretOrPrivateKey, options) : '';
};

// Generate random OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Helper to log admin actions
const logAdminAction = async (adminId: string, action: string, targetType: string, targetId: string, details: any, ip: string = '') => {
    try {
        await createDoc('admin_audit_logs', {
            admin_id: adminId,
            action,
            target_type: targetType,
            target_id: targetId,
            details: details, // Firestore handles objects
            ip_address: ip,
            created_at: new Date()
        });
    } catch (err) {
        console.error('Failed to log admin action:', err);
    }
};

/* -------------------------------------------------------------------------- */
/*                                AUTHENTICATION                              */
/* -------------------------------------------------------------------------- */

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const users = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);
        if (users.length === 0) {
            res.status(401).json({ status: 'error', message: 'Invalid credentials' });
            return;
        }

        const user: any = users[0];

        if (user.role !== 'admin') {
            res.status(403).json({ status: 'error', message: 'Unauthorized access. Admin privileges required.' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ status: 'error', message: 'Invalid credentials' });
            return;
        }

        const token = safeSign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '12h' } as jwt.SignOptions
        );

        res.status(200).json({
            status: 'success',
            message: 'Admin login successful',
            data: {
                token,
                user: { id: user.id, email: user.email, name: user.name, role: user.role }
            }
        });

    } catch (error: any) {
        logger.error('Admin login error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const createAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;

        const existingUsers = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);
        if (existingUsers.length > 0) {
            res.status(409).json({ status: 'error', message: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await createDoc('users', {
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
        await createDoc('admin_otps', {
            email,
            otp,
            expires_at: new Date(expiresAt),
            created_at: new Date()
        });

        try {
            const transporter = createTransporter();
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verify Admin Account - ReadMint',
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
        } catch (emailErr) {
            logger.error('Failed to send admin OTP', emailErr);
            res.status(201).json({
                status: 'success',
                message: 'Admin account created but email failed. Contact support.',
                data: { email, requiresVerification: true }
            });
        }

    } catch (error: any) {
        logger.error('Create admin error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const verifyAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        // Check OTP in Firestore
        // Get latest OTP for email
        // Check if OTP exists and is valid
        const otps = await executeQuery('admin_otps', [{ field: 'email', op: '==', value: email }]);
        // Sort to get latest
        otps.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const latestOtp: any = otps.length > 0 ? otps[0] : null;

        if (!latestOtp || latestOtp.otp !== otp) {
            res.status(400).json({ status: 'error', message: 'Invalid OTP' });
            return;
        }

        const expires = latestOtp.expires_at?.toDate ? latestOtp.expires_at.toDate().getTime() : new Date(latestOtp.expires_at).getTime();

        if (Date.now() > expires) {
            res.status(400).json({ status: 'error', message: 'OTP expired' });
            return;
        }

        // OTP Valid. Remove it
        await deleteDoc('admin_otps', latestOtp.id);

        // Update User
        const users = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);
        if (users.length > 0) {
            const user: any = users[0];
            // Update admin verified status if needed
            if (!user.is_email_verified) {
                await updateDoc('users', user.id, { is_email_verified: true });
            }
        }

        res.status(200).json({ status: 'success', message: 'Admin verified successfully. You may now login.' });

    } catch (error: any) {
        logger.error('Verify admin error:', error);
        res.status(500).json({ status: 'error', message: 'Verification failed' });
    }
};


export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        const users = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);
        if (users.length === 0) {
            res.status(200).json({ status: 'success', message: 'If an account exists, an OTP has been sent.' });
            return;
        }

        const user: any = users[0];
        if (user.role !== 'admin') {
            res.status(200).json({ status: 'success', message: 'If an account exists, an OTP has been sent.' });
            return;
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

        await createDoc('admin_otps', {
            email,
            otp,
            expires_at: new Date(expiresAt),
            created_at: new Date()
        });

        const transporter = createTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Admin Password - ReadMint',
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

    } catch (error: any) {
        logger.error('Forgot password error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process request' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' });
            return;
        }

        const otps = await executeQuery('admin_otps', [{ field: 'email', op: '==', value: email }]);
        otps.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const latestOtp: any = otps.length > 0 ? otps[0] : null;

        if (!latestOtp || latestOtp.otp !== otp) {
            res.status(400).json({ status: 'error', message: 'Invalid OTP' });
            return;
        }

        const expires = latestOtp.expires_at?.toDate ? latestOtp.expires_at.toDate().getTime() : new Date(latestOtp.expires_at).getTime();
        if (Date.now() > expires) {
            res.status(400).json({ status: 'error', message: 'OTP expired' });
            return;
        }

        // OTP Valid
        const users = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);
        if (users.length === 0) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }
        const user: any = users[0];

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await updateDoc('users', user.id, { password: hashedPassword });

        // Clean up OTP
        await deleteDoc('admin_otps', latestOtp.id);

        await logAdminAction(user.id, 'RESET_PASSWORD', 'user', user.id, {});

        res.status(200).json({ status: 'success', message: 'Password reset successfully. Please login.' });

    } catch (error: any) {
        logger.error('Reset password error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to reset password' });
    }
};

/* -------------------------------------------------------------------------- */
/*                                DASHBOARD APIS                              */
/* -------------------------------------------------------------------------- */

export const getPlatformHealth = async (req: Request, res: Response): Promise<void> => {
    try {
        // Optimized to use Aggregation queries (getCount) instead of fetching all docs

        // Parallelize requests
        const [
            totalUsers,
            readers,
            authors,
            reviewers,
            editors,
            contentManagers,
            totalSubmissions,
            pendingReviews,
            inReview,
            editorQueue
        ] = await Promise.all([
            getCount('users'),
            getCount('users', [{ field: 'role', op: '==', value: 'reader' }]),
            getCount('users', [{ field: 'role', op: '==', value: 'author' }]),
            getCount('users', [{ field: 'role', op: '==', value: 'reviewer' }]),
            getCount('users', [{ field: 'role', op: '==', value: 'editor' }]),
            getCount('users', [{ field: 'role', op: '==', value: 'content_manager' }]),
            getCount('content'),
            getCount('content', [{ field: 'status', op: '==', value: 'submitted' }]),
            getCount('content', [{ field: 'status', op: '==', value: 'under_review' }]),
            getCount('editor_assignments', [{ field: 'status', op: 'in', value: ['assigned', 'in_progress'] }])
        ]);

        // Date based stats (Today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [submissionsToday, publishedToday] = await Promise.all([
            getCount('content', [{ field: 'created_at', op: '>=', value: todayStart }]),
            getCount('content', [{ field: 'status', op: '==', value: 'published' }, { field: 'updated_at', op: '>=', value: todayStart }])
        ]);

        const activeSessions = Math.floor(totalUsers * 0.15); // Mock metric as before

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
                    editor_queue: editorQueue // Note: This is now total assignments, not unique articles. Acceptable for health summary.
                },
                alerts: 0,
                system_status: 'operational'
            }
        });

    } catch (error: any) {
        logger.error('Get platform health error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch platform health', details: error?.message });
    }
};

export const getSystemUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        // Fetch ALL users then filter/slice (In-Memory Pagination)
        let users = await executeQuery('users');

        // Filter
        if (role && role !== 'all') {
            users = users.filter((u: any) => u.role === role);
        }

        if (search) {
            const s = (search as string).toLowerCase();
            users = users.filter((u: any) =>
                (u.name && u.name.toLowerCase().includes(s)) ||
                (u.email && u.email.toLowerCase().includes(s))
            );
        }

        // Sort
        users.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
                users: paginatedUsers.map((u: any) => ({
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

    } catch (error: any) {
        logger.error('Get system users error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
    }
};

export const manageUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, newRole, action } = req.body;
        const adminId = (req as any).user?.userId;

        if (action === 'update_role') {
            await updateDoc('users', userId, { role: newRole });
            await logAdminAction(adminId, 'UPDATE_ROLE', 'user', userId, { new_role: newRole });
        } else if (action === 'suspend') {
            const user: any = await getDoc('users', userId);
            if (user) {
                let profile = user.profile_data || {};
                profile.suspended = true;
                await updateDoc('users', userId, { profile_data: profile });
            }
            await logAdminAction(adminId, 'SUSPEND_USER', 'user', userId, {});

        } else if (action === 'activate') {
            const user: any = await getDoc('users', userId);
            if (user) {
                let profile = user.profile_data || {};
                delete profile.suspended;
                await updateDoc('users', userId, { profile_data: profile });
            }
            await logAdminAction(adminId, 'ACTIVATE_USER', 'user', userId, {});
        }

        res.status(200).json({ status: 'success', message: `User action ${action} completed` });

    } catch (error: any) {
        logger.error('Manage user error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update user' });
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;
        const adminId = (req as any).user?.userId;

        // Basic validation
        if (!email || !password || !name) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }

        const existing = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);
        if (existing.length > 0) {
            res.status(409).json({ status: 'error', message: 'User with this email already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const validRoles = ['reader', 'author', 'reviewer', 'editor', 'content_manager', 'admin'];
        const userRole = validRoles.includes(role) ? role : 'reader';

        // Auto-generate ID or let Firestore do it?
        // createDoc with data usually lets Firestore generate ID if not provided.
        // But we need the ID for logging.
        // We can create doc reference first? Or createDoc returns the creating logic result (usually ID)?
        // My helper createDoc signature: `createDoc(collection, data, id?)`. Returns `Promise<string>`.

        const newUserId = await createDoc('users', {
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

    } catch (error: any) {
        logger.error('Create user error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create user' });
    }
};


export const getAllContent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, search, category, page = 1, limit = 20 } = req.query;

        // Fetch content
        // Firestore filter by status directly if possible
        let content: any[] = [];
        if (status && status !== 'all') {
            content = await executeQuery('content', [{ field: 'status', op: '==', value: status }]);
        } else {
            content = await executeQuery('content');
        }

        // Filter by category name (requires fetching categories to map Name -> ID? or fetching article then cat?)
        // Article references category_id. The filter calls for category NAME.
        // We either fetch all CAtegories to find ID, or fetch articles and then filter by joined category name.

        // Fetch authors and categories in parallel or lazy load?
        // Let's fetch all users (authors) and categories for join map if dataset small.
        // Or fetch per item (N+1).
        // Optimization: Fetch unique Author IDs from content list.
        const authorIds = [...new Set(content.map((c: any) => c.author_id))];
        const categoryIds = [...new Set(content.map((c: any) => c.category_id))].filter(Boolean);

        // Fetch authors
        // executeQuery with 'in' (limit 10) or Promise.all(getDoc).
        // Promise.all is robust.
        const authorMap = new Map();
        await Promise.all(authorIds.map(async (uid) => {
            if (!uid) return;
            const u: any = await getDoc('users', uid);
            if (u) authorMap.set(uid, u.name);
        }));

        const categoryMap = new Map();
        await Promise.all(categoryIds.map(async (cid) => {
            if (!cid) return;
            const c: any = await getDoc('categories', cid);
            if (c) categoryMap.set(cid, c.name);
        }));

        // Get Plagiarism Reports (Latest per article)
        // Optimization: Fetch all reports for these article IDs? Or one by one.
        const plagiarismMap = new Map();
        await Promise.all(content.map(async (c: any) => {
            const reports = await executeQuery('plagiarism_reports', [{ field: 'article_id', op: '==', value: c.id }]);
            // Sort to get latest
            reports.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            if (reports.length > 0) {
                plagiarismMap.set(c.id, reports[0]);
            }
        }));

        // Map data
        let formattedContent = content.map((c: any) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            created_at: c.created_at,
            author: authorMap.get(c.author_id) || 'Unknown',
            category: categoryMap.get(c.category_id) || 'Uncategorized',
            plagiarism_status: plagiarismMap.get(c.id)?.status || null,
            plagiarism_score: plagiarismMap.get(c.id)?.similarity_summary
                ? (typeof plagiarismMap.get(c.id).similarity_summary === 'string'
                    ? JSON.parse(plagiarismMap.get(c.id).similarity_summary)
                    : plagiarismMap.get(c.id).similarity_summary)
                : null
        }));

        // Apply remaining filters (Search, Category matches)
        if (category && category !== 'all') {
            formattedContent = formattedContent.filter((c: any) => c.category === category);
        }

        if (search) {
            const s = (search as string).toLowerCase();
            formattedContent = formattedContent.filter((c: any) =>
                (c.title && c.title.toLowerCase().includes(s)) ||
                (c.author && c.author.toLowerCase().includes(s))
            );
        }

        // Sort
        formattedContent.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

    } catch (error: any) {
        logger.error('Get all content error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch content' });
    }
};

export const adminContentAction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { articleId, action, notes } = req.body;
        const adminId = (req as any).user?.userId;

        if (action === 'approve') {
            await updateDoc('content', articleId, { status: 'approved' });
            await logAdminAction(adminId, 'APPROVE_CONTENT', 'article', articleId, { notes });
        } else if (action === 'reject') {
            await updateDoc('content', articleId, { status: 'rejected' });
            await logAdminAction(adminId, 'REJECT_CONTENT', 'article', articleId, { notes });
        } else if (action === 'takedown') {
            await updateDoc('content', articleId, { status: 'rejected' }); // or 'takedown'
            await logAdminAction(adminId, 'TAKEDOWN_CONTENT', 'article', articleId, { notes });
        } else if (action === 'rescan') {
            await logAdminAction(adminId, 'FORCE_RESCAN', 'article', articleId, { notes });
            // Logic to trigger scan? usually separate service or just status reset?
            // Existing code only logged action. Keeping as is.
        }

        res.status(200).json({ status: 'success', message: `Content action ${action} completed` });

    } catch (error: any) {
        logger.error('Admin content action error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to perform content action' });
    }
};

export const getPlagiarismMonitor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, timeframe, page = 1, limit = 20 } = req.query;
        // status: 'pending_check' or 'checked'

        const content = await executeQuery('content');

        let monitorData = await Promise.all(content.map(async (c: any) => {
            // Check reports
            const reports = await executeQuery('plagiarism_reports', [{ field: 'article_id', op: '==', value: c.id }]);
            reports.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const latestReport: any = reports.length > 0 ? reports[0] : null;
            const hasReport = !!latestReport;

            // Check reviewer assignment
            const assignments = await executeQuery('reviewer_assignments', [
                { field: 'article_id', op: '==', value: c.id }
            ]);
            // Filter assigned/completed
            const activeAssign: any = assignments.find((a: any) => ['assigned', 'completed'].includes(a.status));

            let authorName = 'Unknown';
            let reviewerName: string | null = null; // Explicitly type as string | null

            if (c.author_id) {
                const u: any = await getDoc('users', c.author_id);
                if (u) authorName = u.name;
            }
            if (activeAssign && activeAssign.reviewer_id) {
                const r: any = await getDoc('users', activeAssign.reviewer_id);
                if (r) reviewerName = r.name;
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
            monitorData = monitorData.filter((d: any) => d.check_status === 'pending');
        } else if (status === 'checked') {
            monitorData = monitorData.filter((d: any) => d.check_status === 'checked');
        }

        // Sort
        monitorData.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        // Pagination
        const total = monitorData.length;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginated = monitorData.slice(startIndex, endIndex);

        // Format similarity
        const formatted = paginated.map((r: any) => {
            let similarity = 0;
            if (r.similarity_summary) {
                const s = typeof r.similarity_summary === 'string' ? JSON.parse(r.similarity_summary) : r.similarity_summary;
                similarity = s.score || 0;
            }
            return {
                ...r,
                similarity_score: similarity,
                reviewer_ran_check: r.run_by === r.reviewer_id
            };
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

    } catch (error: any) {
        logger.error('Get plagiarism monitor error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch plagiarism monitor' });
    }
};

export const verifyPlagiarismReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reportId, action, notes } = req.body;
        const adminId = (req as any).user?.userId;

        if (action === 'escalate') {
            const report: any = await getDoc('plagiarism_reports', reportId);
            if (report) {
                await createDoc('incidents', {
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
    } catch (error: any) {
        logger.error('Verify plagiarism error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to notify' });
    }
};


export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { adminId, action, page = 1, limit = 50 } = req.query;

        let logs: any[] = [];
        const filters: any[] = [];

        if (adminId) {
            filters.push({ field: 'admin_id', op: '==', value: adminId });
        }
        if (action) {
            filters.push({ field: 'action', op: '==', value: action });
        }

        // executeQuery can handle multiple filters if they are equality checks on different fields
        // For more complex queries (e.g., range queries or OR conditions), in-memory filtering might be needed.
        // Assuming executeQuery can handle multiple '==' filters for now.
        logs = await executeQuery('admin_audit_logs', filters);

        // Sort by created_at descending first to ensure consistent pagination
        logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Fetch Admin Names
        const adminIds = [...new Set(logs.map((l: any) => l.admin_id).filter(Boolean))]; // Filter out null/undefined admin_id
        const adminMap = new Map();
        await Promise.all(adminIds.map(async (uid) => {
            const u: any = await getDoc('users', uid);
            if (u) adminMap.set(uid, u);
        }));

        // Format
        const formattedLogs = logs.map((l: any) => ({
            ...l,
            admin_name: adminMap.get(l.admin_id)?.name || 'Unknown',
            admin_email: adminMap.get(l.admin_id)?.email || 'Unknown',
            details: typeof l.details === 'string' ? JSON.parse(l.details) : l.details
        }));

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

    } catch (error: any) {
        logger.error('Get audit logs error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch logs' });
    }
};

/* -------------------------------------------------------------------------- */
/*                            INCIDENT MANAGEMENT                             */
/* -------------------------------------------------------------------------- */

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;

        // Fetch incidents
        let incidents: any[] = await executeQuery('incidents');

        // Filters
        if (status && status !== 'all') {
            incidents = incidents.filter((i: any) => i.status === status);
        }
        if (priority && priority !== 'all') {
            incidents = incidents.filter((i: any) => i.priority === priority);
        }

        // Sort by created_at descending first to ensure consistent pagination
        incidents.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Fetch Reporters & Assignees
        const userIds = new Set<string>();
        incidents.forEach((i: any) => {
            if (i.reported_by) userIds.add(i.reported_by);
            if (i.assigned_to) userIds.add(i.assigned_to);
        });

        const userMap = new Map();
        await Promise.all(Array.from(userIds).map(async (uid) => {
            const u: any = await getDoc('users', uid);
            if (u) userMap.set(uid, u.name);
        }));

        const formattedIncidents = incidents.map((i: any) => ({
            ...i,
            reporter_name: userMap.get(i.reported_by) || 'Unknown',
            assignee_name: userMap.get(i.assigned_to) || null
        }));

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
    } catch (error: any) {
        logger.error('Get incidents error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch incidents' });
    }
};

export const createIncident = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, priority, relatedSubmissionId } = req.body;
        const adminId = (req as any).user?.userId;

        await createDoc('incidents', {
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
    } catch (error: any) {
        logger.error('Create incident error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create incident' });
    }
};

export const updateIncident = async (req: Request, res: Response): Promise<void> => {
    try {
        const { incidentId, status, priority, assignedTo, notes } = req.body;
        const adminId = (req as any).user?.userId;

        const updates: any = { updated_at: new Date() };
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (assignedTo) updates.assigned_to = assignedTo;
        if (notes) updates.resolution_notes = notes;

        await updateDoc('incidents', incidentId, updates);

        await logAdminAction(adminId, 'UPDATE_INCIDENT', 'incident', incidentId, { status, priority, assignedTo });

        res.status(200).json({ status: 'success', message: 'Incident updated' });
    } catch (error: any) {
        logger.error('Update incident error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update incident' });
    }
};

// Helper for promise all check
const Promise_allCheck = async (promises: Promise<any>[]) => {
    return Promise.allSettled(promises);
}

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, message, targetRole } = req.body;
        const adminId = (req as any).user?.userId;

        // 1. Log in communications (Broadcast record)
        await createDoc('communications', {
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
        let recipients: any[] = [];
        if (targetRole && targetRole !== 'all') {
            recipients = await executeQuery('users', [{ field: 'role', op: '==', value: targetRole }]);
        } else {
            // Original logic: if targetRole is 'all' or not specified, default to 'author'
            recipients = await executeQuery('users', [{ field: 'role', op: '==', value: 'author' }]);
        }

        if (recipients.length > 0) {
            // 3. Send Emails (Batch / Loop)
            const emailPromises = recipients.map((user: any) =>
                sendEmail(
                    user.email,
                    `📢 Announcement: ${title}`,
                    `<div style="font-family: Arial;">
                        <h2>${title}</h2>
                        <p>Dear ${user.name},</p>
                        <p>${message}</p>
                        <br/>
                        <p>Best regards,<br/>ReadMint Admin Team</p>
                    </div>`
                )
            );

            // 4. Create In-App Notifications
            const notifPromises = recipients.map((user: any) =>
                createDoc('notifications', {
                    user_id: user.id,
                    type: 'announcement',
                    title,
                    message,
                    link: '/dashboard',
                    is_read: false,
                    created_at: new Date()
                })
            );

            await Promise_allCheck([...emailPromises, ...notifPromises]);
        }

        await logAdminAction(adminId, 'CREATE_ANNOUNCEMENT', 'system', 'broadcast', { title, target: targetRole });

        res.status(200).json({ status: 'success', message: 'Announcement sent successfully', recipientCount: recipients.length });

    } catch (error: any) {
        logger.error('Create announcement error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send announcement' });
    }
};

/* -------------------------------------------------------------------------- */
/*                              SYSTEM SETTINGS                               */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                              SYSTEM SETTINGS                               */
/* -------------------------------------------------------------------------- */

export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settingsDocs = await executeQuery('system_settings');
        const config: any = settingsDocs.length > 0 ? settingsDocs[0] : {};
        if (config.id) delete config.id;

        res.status(200).json({ status: 'success', data: config });
    } catch (error: any) {
        logger.error('Get system settings error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
    }
};

export const updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { settings } = req.body;
        const adminId = (req as any).user?.userId;

        const existing = await executeQuery('system_settings');
        if (existing.length > 0) {
            await updateDoc('system_settings', existing[0].id, settings);
        } else {
            await createDoc('system_settings', settings);
        }

        await logAdminAction(adminId, 'UPDATE_SETTINGS', 'system', 'settings', { keys: Object.keys(settings) });

        res.status(200).json({ status: 'success', message: 'Settings updated successfully' });
    } catch (error: any) {
        logger.error('Update system settings error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update settings' });
    }
};

/* -------------------------------------------------------------------------- */
/*                              ADVANCED ANALYTICS                            */
/* -------------------------------------------------------------------------- */

export const getAdvancedAnalytics = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error: any) {
        logger.error('Analytics error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch analytics' });
    }
};

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    return getPlatformHealth(req, res);
};
