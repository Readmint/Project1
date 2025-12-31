"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPartners = exports.getPartnerStats = exports.listEvents = exports.createEvent = exports.createManagedUser = exports.createPartner = void 0;
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const mailer_1 = require("../utils/mailer");
const firestore_helpers_1 = require("../utils/firestore-helpers");
const requireAuth = (req, res) => {
    if (!req.user || !req.user.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return false;
    }
    return true;
};
// Admin creates a Partner Organization + Admin User for it
const createPartner = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const { role } = req.user;
        if (role !== 'admin') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Admin only' });
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
            return;
        }
        const { email, password, name, organization_name, type = 'university' } = req.body;
        // Check if user exists
        const existingUsers = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'email', op: '==', value: email }]);
        if (existingUsers.length > 0) {
            res.status(409).json({ status: 'error', message: 'User already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const userId = (0, uuid_1.v4)();
        const partnerId = (0, uuid_1.v4)();
        // Create User (role = partner) linked to this partner (so they manage it)
        await (0, firestore_helpers_1.createDoc)('users', {
            id: userId,
            email,
            password: hashedPassword,
            name,
            role: 'partner',
            partner_id: partnerId,
            is_email_verified: true,
            created_at: new Date()
        }, userId);
        // Create Partner Record
        await (0, firestore_helpers_1.createDoc)('partners', {
            id: partnerId,
            name: organization_name,
            type,
            admin_user_id: userId,
            created_at: new Date()
        }, partnerId);
        res.status(201).json({
            status: 'success',
            message: 'Partner created successfully',
            data: { partnerId, userId, email }
        });
    }
    catch (err) {
        logger_1.logger.error('createPartner error', err);
        res.status(500).json({ status: 'error', message: 'Internal server error', error: err?.message });
    }
};
exports.createPartner = createPartner;
// Partner creates a user (Student/Author/Reader) linked to them
const createManagedUser = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const { userId, role: requesterRole } = req.user;
        if (requesterRole !== 'partner') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Partners only' });
            return;
        }
        // Get partner_id of the requester
        const requester = await (0, firestore_helpers_1.getDoc)('users', userId);
        const partnerId = requester?.partner_id;
        if (!partnerId) {
            res.status(400).json({ status: 'error', message: 'User is not linked to a partner organization' });
            return;
        }
        const { email, password, name, role } = req.body;
        if (!['author', 'reader'].includes(role)) {
            res.status(400).json({ status: 'error', message: 'Invalid role. Must be author or reader.' });
            return;
        }
        const existingUsers = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'email', op: '==', value: email }]);
        if (existingUsers.length > 0) {
            res.status(409).json({ status: 'error', message: 'User already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUserId = (0, uuid_1.v4)();
        await (0, firestore_helpers_1.createDoc)('users', {
            id: newUserId,
            email,
            password: hashedPassword,
            name,
            role,
            partner_id: partnerId,
            is_email_verified: true,
            created_at: new Date()
        }, newUserId);
        // If author, verify in authors table (create basic profile if missing)
        if (role === 'author') {
            // Use userId as author doc ID for new system
            await (0, firestore_helpers_1.createDoc)('authors', {
                user_id: newUserId,
                display_name: name,
                joined_date: new Date()
            }, newUserId);
            // Allow backward compat if queried by ID? 
            // The system now prefers getDoc('authors', userId).
        }
        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: { userId: newUserId, email, role, partnerId }
        });
    }
    catch (err) {
        logger_1.logger.error('createManagedUser error', err);
        res.status(500).json({ status: 'error', message: 'Failed to create user', error: err?.message });
    }
};
exports.createManagedUser = createManagedUser;
const createEvent = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const { userId } = req.user;
        const requester = await (0, firestore_helpers_1.getDoc)('users', userId);
        const partnerId = requester?.partner_id;
        if (!partnerId) {
            res.status(403).json({ status: 'error', message: 'User not associated with a partner' });
            return;
        }
        const { title, description, start_date, end_date } = req.body;
        const eventId = (0, uuid_1.v4)();
        await (0, firestore_helpers_1.createDoc)('partner_events', {
            id: eventId,
            partner_id: partnerId,
            title,
            description,
            start_date,
            end_date,
            status: 'upcoming',
            created_at: new Date()
        }, eventId);
        // Notify Admins
        try {
            const admins = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'role', op: '==', value: 'admin' }]);
            if (admins && admins.length > 0) {
                const adminEmails = admins.map((a) => a.email);
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
                await Promise.all(adminEmails.map((email) => (0, mailer_1.sendEmail)(email, subject, html)));
                logger_1.logger.info(`Notified ${adminEmails.length} admins about new event ${eventId}`);
            }
        }
        catch (emailErr) {
            logger_1.logger.warn('Failed to send admin notifications for new event', emailErr);
        }
        res.status(201).json({
            status: 'success',
            message: 'Event created',
            data: { id: eventId, title }
        });
    }
    catch (err) {
        logger_1.logger.error('createEvent error', err);
        res.status(500).json({ status: 'error', message: 'Failed to create event', error: err?.message });
    }
};
exports.createEvent = createEvent;
const listEvents = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const { userId, role } = req.user;
        let partnerId = null;
        const requester = await (0, firestore_helpers_1.getDoc)('users', userId);
        // If partner, get their own events
        if (role === 'partner') {
            partnerId = requester?.partner_id;
        }
        // If author/reader, get events of their partner
        else if (['author', 'reader'].includes(role || '')) {
            partnerId = requester?.partner_id;
        }
        if (!partnerId) {
            // If no partner linked, return empty
            res.status(200).json({ status: 'success', data: [] });
            return;
        }
        const events = await (0, firestore_helpers_1.executeQuery)('partner_events', [{ field: 'partner_id', op: '==', value: partnerId }]);
        // Sort in memory
        events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        res.status(200).json({ status: 'success', data: events });
    }
    catch (err) {
        logger_1.logger.error('listEvents error', err);
        res.status(500).json({ status: 'error', message: 'Failed to list events', error: err?.message });
    }
};
exports.listEvents = listEvents;
const getPartnerStats = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const { userId, role } = req.user;
        if (role !== 'partner') {
            res.status(403).json({ status: 'error', message: 'Forbidden' });
            return;
        }
        const requester = await (0, firestore_helpers_1.getDoc)('users', userId);
        const partnerId = requester?.partner_id;
        if (!partnerId) {
            res.status(400).json({ status: 'error', message: 'No partner link' });
            return;
        }
        // Stats: Count users, Count events, Count submissions
        const users = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'partner_id', op: '==', value: partnerId }]);
        const events = await (0, firestore_helpers_1.executeQuery)('partner_events', [{ field: 'partner_id', op: '==', value: partnerId }]);
        let submissionsCount = 0;
        // Filter users who are authors
        const authors = users.filter((u) => u.role === 'author');
        // For each author, get their stats from author_stats (more efficient than counting all content)
        // Or if author_stats doesn't exist, count content?
        // Let's try author_stats first.
        for (const authorUser of authors) {
            // Try fetching stat by userId (preferred) or via querying author_id
            let stats = await (0, firestore_helpers_1.getDoc)('author_stats', authorUser.id);
            if (!stats) {
                const statRows = await (0, firestore_helpers_1.executeQuery)('author_stats', [{ field: 'author_id', op: '==', value: authorUser.id }]);
                if (statRows.length > 0)
                    stats = statRows[0];
            }
            if (stats && stats.articles_published) {
                submissionsCount += (Number(stats.articles_published) || 0);
            }
        }
        res.status(200).json({
            status: 'success',
            data: {
                users: users.length,
                events: events.length,
                submissions: submissionsCount
            }
        });
    }
    catch (err) {
        logger_1.logger.error('getPartnerStats error', err);
        res.status(500).json({ status: 'error', message: 'Failed to get stats', error: err?.message });
    }
};
exports.getPartnerStats = getPartnerStats;
const getAllPartners = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const { role } = req.user;
        if (role !== 'admin') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Admin only' });
            return;
        }
        // Fetch partners
        const partners = await (0, firestore_helpers_1.executeQuery)('partners', []);
        // Manual join for admin user details
        const results = await Promise.all(partners.map(async (p) => {
            let adminName = null;
            let adminEmail = null;
            if (p.admin_user_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', p.admin_user_id);
                if (u) {
                    adminName = u.name;
                    adminEmail = u.email;
                }
            }
            return {
                id: p.id,
                name: p.name,
                type: p.type,
                created_at: p.created_at,
                admin_name: adminName,
                admin_email: adminEmail
            };
        }));
        // Sort desc
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        res.status(200).json({
            status: 'success',
            data: results
        });
    }
    catch (err) {
        logger_1.logger.error('getAllPartners error', err);
        res.status(500).json({ status: 'error', message: 'Failed to list partners', error: err?.message });
    }
};
exports.getAllPartners = getAllPartners;
//# sourceMappingURL=partner.controller.js.map