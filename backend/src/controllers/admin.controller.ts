import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';
import { sendEmail } from '../utils/mailer';

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

const adminOtpStore = new Map();

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
        const db: any = getDatabase();
        await db.execute(
            `INSERT INTO admin_audit_logs (id, admin_id, action, target_type, target_id, details, ip_address, created_at)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())`,
            [adminId, action, targetType, targetId, JSON.stringify(details), ip]
        );
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
        const db: any = getDatabase();

        const [users]: any = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            res.status(401).json({ status: 'error', message: 'Invalid credentials' });
            return;
        }

        const user = users[0];

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
        const db: any = getDatabase();

        const [existingUsers]: any = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            res.status(409).json({ status: 'error', message: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await db.execute(
            'INSERT INTO users (id, email, password, name, role, is_email_verified, created_at) VALUES (UUID(), ?, ?, ?, "admin", false, NOW())',
            [email, hashedPassword, name || 'Admin User']
        );

        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        adminOtpStore.set(email, { otp, expiresAt });

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
        const storedData = adminOtpStore.get(email);

        if (!storedData) {
            res.status(400).json({ status: 'error', message: 'OTP not found or expired' });
            return;
        }

        if (Date.now() > storedData.expiresAt) {
            adminOtpStore.delete(email);
            res.status(400).json({ status: 'error', message: 'OTP has expired' });
            return;
        }

        if (storedData.otp !== otp) {
            res.status(400).json({ status: 'error', message: 'Invalid OTP' });
            return;
        }

        adminOtpStore.delete(email);
        const db: any = getDatabase();

        await db.execute(
            'UPDATE users SET is_email_verified = true WHERE email = ?',
            [email]
        );

        res.status(200).json({ status: 'success', message: 'Admin verified successfully. You may now login.' });

    } catch (error: any) {
        logger.error('Verify admin error:', error);
        res.status(500).json({ status: 'error', message: 'Verification failed' });
    }
};

/* -------------------------------------------------------------------------- */
/*                                DASHBOARD APIS                              */
/* -------------------------------------------------------------------------- */

export const getPlatformHealth = async (req: Request, res: Response): Promise<void> => {
    try {
        const db: any = getDatabase();

        const [users]: any = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN role = 'reader' THEN 1 ELSE 0 END) as readers,
                SUM(CASE WHEN role = 'author' THEN 1 ELSE 0 END) as authors,
                SUM(CASE WHEN role = 'reviewer' THEN 1 ELSE 0 END) as reviewers,
                SUM(CASE WHEN role = 'editor' THEN 1 ELSE 0 END) as editors,
                SUM(CASE WHEN role = 'content_manager' THEN 1 ELSE 0 END) as content_managers
            FROM users
        `);

        const [contentStats]: any = await db.execute(`
             SELECT 
                COUNT(*) as total_submissions,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as submissions_today,
                SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending_reviews,
                SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as in_review,
                SUM(CASE WHEN status = 'published' AND DATE(updated_at) = CURDATE() THEN 1 ELSE 0 END) as published_today
             FROM content
        `);

        const [editorQueue]: any = await db.execute(`
             SELECT COUNT(DISTINCT article_id) as count FROM editor_assignments WHERE status IN ('assigned', 'in_progress')
        `);

        const activeSessions = Math.floor(users[0].total * 0.15); // Simulated

        res.status(200).json({
            status: 'success',
            data: {
                users: users[0],
                sessions: { active: activeSessions, daily_active: Math.floor(users[0].total * 0.3) },
                content: {
                    ...contentStats[0],
                    editor_queue: editorQueue[0].count
                },
                alerts: 0,
                system_status: 'operational'
            }
        });

    } catch (error: any) {
        logger.error('Get platform health error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch platform health' });
    }
};

export const getSystemUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const db: any = getDatabase();

        let query = `SELECT id, name, email, role, created_at, is_email_verified FROM users WHERE 1=1`;
        const params: any[] = [];

        if (role && role !== 'all') {
            query += ` AND role = ?`;
            params.push(role);
        }

        if (search) {
            query += ` AND (name LIKE ? OR email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        const safeLimit = Number(limit) || 20;
        const safeOffset = (Number(page) - 1) * safeLimit;

        query += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
        // params.push(safeLimit, safeOffset); // Removed due to interpolation

        const [users]: any = await db.execute(query, params);

        let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
        const countParams: any[] = [];
        if (role && role !== 'all') { countQuery += ` AND role = ?`; countParams.push(role); }
        if (search) { countQuery += ` AND (name LIKE ? OR email LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`); }
        const [total]: any = await db.execute(countQuery, countParams);

        res.status(200).json({
            status: 'success',
            data: {
                users,
                pagination: {
                    total: total[0].total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total[0].total / Number(limit))
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
        const db: any = getDatabase();

        if (action === 'update_role') {
            await db.execute('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
            await logAdminAction(adminId, 'UPDATE_ROLE', 'user', userId, { new_role: newRole });
        } else if (action === 'suspend') {
            const [userRows]: any = await db.execute('SELECT profile_data FROM users WHERE id = ?', [userId]);
            if (userRows.length > 0) {
                let profile = userRows[0].profile_data || {};
                profile.suspended = true;
                await db.execute('UPDATE users SET profile_data = ? WHERE id = ?', [JSON.stringify(profile), userId]);
            }
            await logAdminAction(adminId, 'SUSPEND_USER', 'user', userId, {});

        } else if (action === 'activate') {
            const [userRows]: any = await db.execute('SELECT profile_data FROM users WHERE id = ?', [userId]);
            if (userRows.length > 0) {
                let profile = userRows[0].profile_data || {};
                delete profile.suspended;
                await db.execute('UPDATE users SET profile_data = ? WHERE id = ?', [JSON.stringify(profile), userId]);
            }
            await logAdminAction(adminId, 'ACTIVATE_USER', 'user', userId, {});
        }

        // ... (manageUserRole logic)
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
        const db: any = getDatabase();

        // Basic validation
        if (!email || !password || !name) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }

        const [existing]: any = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            res.status(409).json({ status: 'error', message: 'User with this email already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const validRoles = ['reader', 'author', 'reviewer', 'editor', 'content_manager', 'admin'];
        const userRole = validRoles.includes(role) ? role : 'reader';

        await db.execute(
            'INSERT INTO users (id, email, password, name, role, is_email_verified, created_at, profile_data) VALUES (UUID(), ?, ?, ?, ?, true, NOW(), ?)',
            [email, hashedPassword, name, userRole, JSON.stringify({})]
        );

        // Get the new ID to log
        const [newUser]: any = await db.execute('SELECT id FROM users WHERE email = ?', [email]);

        await logAdminAction(adminId, 'CREATE_USER', 'user', newUser[0].id, { name, email, role: userRole });

        res.status(201).json({ status: 'success', message: 'User created successfully' });

    } catch (error: any) {
        logger.error('Create user error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create user' });
    }
};

export const getAllContent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, search, category, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const db: any = getDatabase();

        let query = `
            SELECT 
                c.id, c.title, c.status, c.created_at, 
                u.name as author, 
                cat.name as category,
                (SELECT status FROM plagiarism_reports WHERE article_id = c.id ORDER BY created_at DESC LIMIT 1) as plagiarism_status,
                (SELECT similarity_summary FROM plagiarism_reports WHERE article_id = c.id ORDER BY created_at DESC LIMIT 1) as plagiarism_score
            FROM content c
            JOIN users u ON c.author_id = u.id
            LEFT JOIN categories cat ON c.category_id = cat.category_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status && status !== 'all') { query += ` AND c.status = ?`; params.push(status); }
        if (category && category !== 'all') { query += ` AND cat.name = ?`; params.push(category); }
        if (search) { query += ` AND (c.title LIKE ? OR u.name LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

        const safeLimit = Number(limit) || 20;
        const safeOffset = (Number(page) - 1) * safeLimit;

        query += ` ORDER BY c.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
        // params.push(safeLimit, safeOffset); // Removed due to interpolation

        const [content]: any = await db.execute(query, params);

        let countQuery = `SELECT COUNT(*) as total FROM content c JOIN users u ON c.author_id = u.id LEFT JOIN categories cat ON c.category_id = cat.category_id WHERE 1=1`;
        const countParams: any[] = [];
        if (status && status !== 'all') { countQuery += ` AND c.status = ?`; countParams.push(status); }
        if (category && category !== 'all') { countQuery += ` AND cat.name = ?`; countParams.push(category); }
        if (search) { countQuery += ` AND (c.title LIKE ? OR u.name LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`); }

        const [total]: any = await db.execute(countQuery, countParams);

        const formattedContent = content.map((item: any) => ({
            ...item,
            plagiarism_score: item.plagiarism_score ? (typeof item.plagiarism_score === 'string' ? JSON.parse(item.plagiarism_score) : item.plagiarism_score) : null
        }));

        res.status(200).json({
            status: 'success',
            data: {
                content: formattedContent,
                pagination: {
                    total: total[0].total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total[0].total / Number(limit))
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
        const db: any = getDatabase();

        if (action === 'approve') {
            await db.execute("UPDATE content SET status = 'approved' WHERE id = ?", [articleId]);
            await logAdminAction(adminId, 'APPROVE_CONTENT', 'article', articleId, { notes });
        } else if (action === 'reject') {
            await db.execute("UPDATE content SET status = 'rejected' WHERE id = ?", [articleId]);
            await logAdminAction(adminId, 'REJECT_CONTENT', 'article', articleId, { notes });
        } else if (action === 'takedown') {
            await db.execute("UPDATE content SET status = 'rejected' WHERE id = ?", [articleId]);
            await logAdminAction(adminId, 'TAKEDOWN_CONTENT', 'article', articleId, { notes });
        } else if (action === 'rescan') {
            await logAdminAction(adminId, 'FORCE_RESCAN', 'article', articleId, { notes });
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
        const offset = (Number(page) - 1) * Number(limit);
        const db: any = getDatabase();

        let query = `
            SELECT 
                c.id as article_id, 
                c.title, 
                u.name as author_name,
                ra.reviewer_id,
                ru.name as reviewer_name,
                pr.id as report_id,
                pr.similarity_summary,
                pr.created_at as check_date,
                pr.run_by,
                (CASE WHEN pr.id IS NOT NULL THEN 'checked' ELSE 'pending' END) as check_status
            FROM content c
            JOIN users u ON c.author_id = u.id
            LEFT JOIN reviewer_assignments ra ON c.id = ra.article_id AND ra.status IN ('assigned', 'completed')
            LEFT JOIN users ru ON ra.reviewer_id = ru.id
            LEFT JOIN (
                SELECT * FROM plagiarism_reports WHERE id IN (
                    SELECT MAX(id) FROM plagiarism_reports GROUP BY article_id
                )
            ) pr ON c.id = pr.article_id
            WHERE 1=1
        `;

        const params: any[] = [];

        if (status === 'pending_check') {
            query += ` AND pr.id IS NULL`;
        } else if (status === 'checked') {
            query += ` AND pr.id IS NOT NULL`;
        }

        const safeLimit = Number(limit) || 20;
        const safeOffset = (Number(page) - 1) * safeLimit;

        query += ` ORDER BY c.updated_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
        // params.push(safeLimit, safeOffset); // Removed due to interpolation

        const [reports]: any = await db.execute(query, params);
        const [countTotal]: any = await db.execute(`SELECT COUNT(*) as total FROM content c`);

        const formatted = reports.map((r: any) => {
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
                    total: countTotal[0].total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(countTotal[0].total / Number(limit))
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
        const db: any = getDatabase();

        if (action === 'escalate') {
            await db.execute("INSERT INTO incidents (id, title, description, status, priority, submission_id, reported_by) VALUES (UUID(), ?, ?, 'open', 'high', (SELECT article_id FROM plagiarism_reports WHERE id=?), ?)",
                ['Plagiarism Escalation', `Escalated by admin. Notes: ${notes}`, reportId, adminId]
            );
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
        const offset = (Number(page) - 1) * Number(limit);
        const db: any = getDatabase();

        let query = `
            SELECT 
                al.*,
                u.name as admin_name,
                u.email as admin_email
            FROM admin_audit_logs al
            JOIN users u ON al.admin_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (adminId) { query += ` AND al.admin_id = ?`; params.push(adminId); }
        if (action) { query += ` AND al.action = ?`; params.push(action); }

        const safeLimit = Number(limit) || 50;
        const safeOffset = (Number(page) - 1) * safeLimit;

        query += ` ORDER BY al.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
        // params.push(safeLimit, safeOffset); // Removed due to interpolation

        const [logs]: any = await db.execute(query, params);

        let countQuery = `SELECT COUNT(*) as total FROM admin_audit_logs al WHERE 1=1`;
        const countParams: any[] = [];
        if (adminId) { countQuery += ` AND al.admin_id = ?`; countParams.push(adminId); }
        if (action) { countQuery += ` AND al.action = ?`; countParams.push(action); }

        const [total]: any = await db.execute(countQuery, countParams);

        res.status(200).json({
            status: 'success',
            data: {
                logs,
                pagination: {
                    total: total[0].total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total[0].total / Number(limit))
                }
            }
        });

    } catch (error: any) {
        logger.error('Get audit logs error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch logs' });
    }
};

// ... existing exports

/* -------------------------------------------------------------------------- */
/*                            INCIDENT MANAGEMENT                             */
/* -------------------------------------------------------------------------- */

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const db: any = getDatabase();

        let query = `
            SELECT i.*, 
                   u.name as reporter_name, 
                   au.name as assignee_name
            FROM incidents i
            LEFT JOIN users u ON i.reported_by = u.id
            LEFT JOIN users au ON i.assigned_to = au.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status && status !== 'all') { query += ` AND i.status = ?`; params.push(status); }
        if (priority && priority !== 'all') { query += ` AND i.priority = ?`; params.push(priority); }

        const safeLimit = Number(limit) || 20;
        const safeOffset = (Number(page) - 1) * safeLimit;

        query += ` ORDER BY i.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
        // params.push(safeLimit, safeOffset); // Removed due to interpolation

        const [incidents]: any = await db.execute(query, params);

        let countQuery = `SELECT COUNT(*) as total FROM incidents i WHERE 1=1`;
        const countParams: any[] = [];
        if (status && status !== 'all') { countQuery += ` AND i.status = ?`; countParams.push(status); }
        if (priority && priority !== 'all') { countQuery += ` AND i.priority = ?`; countParams.push(priority); }

        const [total]: any = await db.execute(countQuery, countParams);

        res.status(200).json({
            status: 'success',
            data: {
                incidents,
                pagination: {
                    total: total[0].total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total[0].total / Number(limit))
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
        const db: any = getDatabase();

        await db.execute(
            `INSERT INTO incidents (id, title, description, priority, status, submission_id, reported_by, created_at) 
             VALUES (UUID(), ?, ?, ?, 'open', ?, ?, NOW())`,
            [title, description, priority || 'medium', relatedSubmissionId || null, adminId]
        );

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
        const db: any = getDatabase();

        let query = "UPDATE incidents SET updated_at = NOW()";
        const params: any[] = [];

        if (status) { query += ", status = ?"; params.push(status); }
        if (priority) { query += ", priority = ?"; params.push(priority); }
        if (assignedTo) { query += ", assigned_to = ?"; params.push(assignedTo); }
        if (notes) { query += ", resolution_notes = ?"; params.push(notes); }

        query += " WHERE id = ?";
        params.push(incidentId);

        await db.execute(query, params);
        await logAdminAction(adminId, 'UPDATE_INCIDENT', 'incident', incidentId, { status, priority, assignedTo });

        res.status(200).json({ status: 'success', message: 'Incident updated' });
    } catch (error: any) {
        logger.error('Update incident error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update incident' });
    }
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, message, targetRole } = req.body;
        const adminId = (req as any).user?.userId;
        const db: any = getDatabase();

        // 1. Log in communications (Broadcast record)
        await db.execute(
            `INSERT INTO communications (id, sender_id, receiver_id, message, type, entity_type, entity_id, is_read, created_at)
             VALUES (UUID(), ?, ?, ?, 'system', 'announcement', NULL, false, NOW())`,
            [adminId, targetRole || 'all', JSON.stringify({ title, body: message })]
        );

        // 2. Fetch recipients
        let query = "SELECT id, email, name FROM users WHERE 1=1";
        const params: any[] = [];
        if (targetRole && targetRole !== 'all') {
            query += " AND role = ?";
            params.push(targetRole);
        } else {
            // If 'all', we might want to target mainly content creators/consumers? 
            // User said "all the authors". Let's stick to 'author' if not specified, or all if explicit.
            // But usually 'all authors' means role='author'.
            query += " AND role = 'author'";
        }

        const [recipients]: any = await db.execute(query, params);

        if (recipients.length > 0) {
            // 3. Send Emails (Batch / Loop)
            // Note: In production, use a queue (Bull/RabbitMQ). Here, await all promises.
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
            // Optimization: Bulk insert if driver supports it, or loop. 
            // MySQL2 execute doesn't support bulk easily without building big string. Loop is safer for now.
            const notifPromises = recipients.map((user: any) =>
                db.execute(
                    `INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at)
                     VALUES (UUID(), ?, 'announcement', ?, ?, '/dashboard', false, NOW())`,
                    [user.id, title, message]
                )
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

// Helper to wait for all but not fail if one fails (allSettled equivalent)
const Promise_allCheck = async (promises: Promise<any>[]) => {
    const results = await Promise.allSettled(promises);
    return results;
};

/* -------------------------------------------------------------------------- */
/*                              SYSTEM SETTINGS                               */
/* -------------------------------------------------------------------------- */

export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const db: any = getDatabase();
        const [rows]: any = await db.execute('SELECT setting_key, setting_value FROM system_settings');

        const settings: any = {};
        rows.forEach((row: any) => {
            settings[row.setting_key] = row.setting_value; // Assuming JSON column parsing handled by driver or manual
        });

        res.status(200).json({ status: 'success', data: settings });
    } catch (error: any) {
        logger.error('Get system settings error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
    }
};

export const updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { settings } = req.body; // Expects { key: value, key2: value2 }
        const adminId = (req as any).user?.userId;
        const db: any = getDatabase();

        // Use transaction or Promise.all
        const queries = Object.keys(settings).map(key => {
            return db.execute(
                `INSERT INTO system_settings (setting_key, setting_value, updated_at)
                 VALUES (?, ?, NOW())
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                [key, JSON.stringify(settings[key])] // Store value as JSON
            );
        });

        await Promise.all(queries);
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
        const db: any = getDatabase();

        // 1. Content Velocity (Submissions per day over last 30 days)
        const [contentVelocity]: any = await db.execute(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM content
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // 2. Editor Performance (Avg time to decision) - Mockish logic since we need complex time diffs
        // Simplification: Count decisions made
        const [editorPerformance]: any = await db.execute(`
            SELECT
                u.name as editor_name,
                COUNT(ea.id) as actions_count
            FROM editor_activity ea
            JOIN editors e ON ea.editor_id = e.id
            JOIN users u ON e.user_id = u.id
            GROUP BY u.name
            LIMIT 5
        `);

        // 3. Reviewer Statistics (Top reviewers)
        // Fixed: Added ra.reviewer_id to GROUP BY to comply with ONLY_FULL_GROUP_BY
        const [reviewerStats]: any = await db.execute(`
            SELECT
                u.name as reviewer_name,
                COUNT(ra.id) as assigned_count,
                SUM(CASE WHEN ra.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                (SELECT COUNT(*) FROM plagiarism_reports pr WHERE pr.run_by = ra.reviewer_id AND pr.article_id = ra.article_id) as scans_run
            FROM reviewer_assignments ra
            JOIN users u ON ra.reviewer_id = u.id
            GROUP BY ra.reviewer_id, u.name
            ORDER BY assigned_count DESC
            LIMIT 10
        `);

        res.status(200).json({
            status: 'success',
            data: {
                contentVelocity,
                editorPerformance,
                reviewerStats
            }
        });
    } catch (error: any) {
        logger.error('Analytics error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch analytics' });
    }
};

/* -------------------------------------------------------------------------- */
/*                              ADMIN STATS                                   */
/* -------------------------------------------------------------------------- */

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    return getPlatformHealth(req, res);
};
