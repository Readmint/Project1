import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/mailer';

const requireAuth = (req: Request, res: Response): boolean => {
    if (!req.user || !req.user.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return false;
    }
    return true;
};

// Admin creates a Partner Organization + Admin User for it
export const createPartner = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!requireAuth(req, res)) return;
        const { role } = req.user!;
        if (role !== 'admin') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Admin only' });
            return;
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
            return;
        }

        const { email, password, name, organization_name, type = 'university' } = req.body;
        const db: any = getDatabase();

        // Check if user exists
        const [existing]: any = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            res.status(409).json({ status: 'error', message: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = uuidv4();
        const partnerId = uuidv4();

        // Create User (role = partner) linked to this partner (so they manage it)
        await db.execute(
            `INSERT INTO users (id, email, password, name, role, partner_id, is_email_verified, created_at)
       VALUES (?, ?, ?, ?, 'partner', ?, ?, NOW())`,
            [userId, email, hashedPassword, name, partnerId, true]
        );

        // Create Partner Record
        await db.execute(
            `INSERT INTO partners (id, name, type, admin_user_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
            [partnerId, organization_name, type, userId]
        );

        res.status(201).json({
            status: 'success',
            message: 'Partner created successfully',
            data: { partnerId, userId, email }
        });

    } catch (err: any) {
        logger.error('createPartner error', err);
        res.status(500).json({ status: 'error', message: 'Internal server error', error: err?.message });
    }
};

// Partner creates a user (Student/Author/Reader) linked to them
export const createManagedUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!requireAuth(req, res)) return;
        const { userId, role: requesterRole } = req.user!;

        if (requesterRole !== 'partner') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Partners only' });
            return;
        }

        const db: any = getDatabase();

        // Get partner_id of the requester
        const [pRows]: any = await db.execute('SELECT partner_id FROM users WHERE id = ?', [userId]);
        const partnerId = pRows[0]?.partner_id;

        if (!partnerId) {
            res.status(400).json({ status: 'error', message: 'User is not linked to a partner organization' });
            return;
        }

        const { email, password, name, role } = req.body;

        if (!['author', 'reader'].includes(role)) {
            res.status(400).json({ status: 'error', message: 'Invalid role. Must be author or reader.' });
            return;
        }

        const [existing]: any = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            res.status(409).json({ status: 'error', message: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUserId = uuidv4();

        await db.execute(
            `INSERT INTO users (id, email, password, name, role, partner_id, is_email_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [newUserId, email, hashedPassword, name, role, partnerId, true]
        );

        // If author, verify in authors table (create basic profile if missing)
        if (role === 'author') {
            const authorId = uuidv4();
            await db.execute(
                `INSERT INTO authors (id, user_id, display_name, joined_date) VALUES (?, ?, ?, NOW())`,
                [authorId, newUserId, name]
            );
        }

        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: { userId: newUserId, email, role, partnerId }
        });

    } catch (err: any) {
        logger.error('createManagedUser error', err);
        res.status(500).json({ status: 'error', message: 'Failed to create user', error: err?.message });
    }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!requireAuth(req, res)) return;
        const { userId } = req.user!;
        const db: any = getDatabase();

        const [pRows]: any = await db.execute('SELECT partner_id FROM users WHERE id = ?', [userId]);
        const partnerId = pRows[0]?.partner_id;

        if (!partnerId) {
            res.status(403).json({ status: 'error', message: 'User not associated with a partner' });
            return;
        }

        const { title, description, start_date, end_date } = req.body;
        const eventId = uuidv4();

        await db.execute(
            `INSERT INTO partner_events (id, partner_id, title, description, start_date, end_date, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'upcoming', NOW())`,
            [eventId, partnerId, title, description, start_date, end_date]
        );

        // Notify Admins
        try {
            const [admins]: any = await db.execute("SELECT email FROM users WHERE role = 'admin'");
            if (admins && admins.length > 0) {
                const adminEmails = admins.map((a: any) => a.email);
                const subject = `New Partner Event Scheduled: ${title}`;
                const html = `
                    <h2>New Partner Event Created</h2>
                    <p><strong>Partner ID:</strong> ${partnerId}</p>
                    <p><strong>Title:</strong> ${title}</p>
                    <p><strong>Description:</strong> ${description || 'N/A'}</p>
                    <p><strong>Start Date:</strong> ${start_date}</p>
                    <p><strong>End Date:</strong> ${end_date}</p>
                    <br/>
                    <p>Please review explicitly if required.</p>
                `;

                await Promise.all(adminEmails.map((email: string) => sendEmail(email, subject, html)));
                logger.info(`Notified ${adminEmails.length} admins about new event ${eventId}`);
            }
        } catch (emailErr) {
            logger.warn('Failed to send admin notifications for new event', emailErr);
        }

        res.status(201).json({
            status: 'success',
            message: 'Event created',
            data: { id: eventId, title }
        });

    } catch (err: any) {
        logger.error('createEvent error', err);
        res.status(500).json({ status: 'error', message: 'Failed to create event', error: err?.message });
    }
};

export const listEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!requireAuth(req, res)) return;
        const { userId, role } = req.user!;
        const db: any = getDatabase();

        let partnerId: string | null = null;

        // If partner, get their own events
        if (role === 'partner') {
            const [pRows]: any = await db.execute('SELECT partner_id FROM users WHERE id = ?', [userId]);
            partnerId = pRows[0]?.partner_id;
        }
        // If author/reader, get events of their partner
        else if (['author', 'reader'].includes(role || '')) {
            const [pRows]: any = await db.execute('SELECT partner_id FROM users WHERE id = ?', [userId]);
            partnerId = pRows[0]?.partner_id;
        }

        if (!partnerId) {
            // If no partner linked, return empty or all public (depending on logic, user asked for 'multiple author option... create events related to publishing')
            // For now return empty if not linked
            res.status(200).json({ status: 'success', data: [] });
            return;
        }

        const [events]: any = await db.execute(
            `SELECT * FROM partner_events WHERE partner_id = ? ORDER BY created_at DESC`,
            [partnerId]
        );

        res.status(200).json({ status: 'success', data: events });

    } catch (err: any) {
        logger.error('listEvents error', err);
        res.status(500).json({ status: 'error', message: 'Failed to list events', error: err?.message });
    }
};

export const getPartnerStats = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!requireAuth(req, res)) return;
        const { userId, role } = req.user!;
        const db: any = getDatabase();

        if (role !== 'partner') {
            res.status(403).json({ status: 'error', message: 'Forbidden' });
            return;
        }

        const [pRows]: any = await db.execute('SELECT partner_id FROM users WHERE id = ?', [userId]);
        const partnerId = pRows[0]?.partner_id;

        if (!partnerId) {
            res.status(400).json({ status: 'error', message: 'No partner link' });
            return;
        }

        // Stats: Count users, Count events, Count submissions
        const [userCount]: any = await db.execute('SELECT COUNT(*) as count FROM users WHERE partner_id = ?', [partnerId]);
        const [eventCount]: any = await db.execute('SELECT COUNT(*) as count FROM partner_events WHERE partner_id = ?', [partnerId]);

        // submissions check content where author is linked to partner
        // OR content linked to partner events
        const [subCount]: any = await db.execute(`
            SELECT COUNT(c.id) as count 
            FROM content c
            JOIN users u ON c.author_id = u.id
            WHERE u.partner_id = ?
        `, [partnerId]);

        res.status(200).json({
            status: 'success',
            data: {
                users: userCount[0].count,
                events: eventCount[0].count,
                submissions: subCount[0].count
            }
        });

    } catch (err: any) {
        logger.error('getPartnerStats error', err);
        res.status(500).json({ status: 'error', message: 'Failed to get stats', error: err?.message });
    }
};

export const getAllPartners = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!requireAuth(req, res)) return;
        const { role } = req.user!;

        if (role !== 'admin') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Admin only' });
            return;
        }

        const db: any = getDatabase();

        // Fetch partners joined with their admin user details (name, email)
        const [rows]: any = await db.execute(`
            SELECT p.id, p.name, p.type, p.created_at, u.email as admin_email, u.name as admin_name
            FROM partners p
            LEFT JOIN users u ON p.admin_user_id = u.id
            ORDER BY p.created_at DESC
        `);

        res.status(200).json({
            status: 'success',
            data: rows
        });

    } catch (err: any) {
        logger.error('getAllPartners error', err);
        res.status(500).json({ status: 'error', message: 'Failed to list partners', error: err?.message });
    }
};
