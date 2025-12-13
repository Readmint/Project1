
import { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { sendEmail } from '../utils/mailer';

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId; // This is the UUID from users table
        const db: any = getDatabase();

        // Join reviewer_assignments with content and users (author)
        // reviewer_assignments.reviewer_id matches users.id because in assignReviewer we used user.id
        const query = `
            SELECT 
                ra.id as assignment_id,
                ra.status as assignment_status,
                ra.assigned_date,
                ra.due_date,
                c.id as article_id,
                c.title,
                c.category_id,
                cat.name as category_name,
                u.name as author_name,
                u.id as author_id,
                c.status as article_status,
                creator.name as manager_name,
                creator.id as manager_id,
                e_user.name as editor_name,
                e_user.id as editor_id
            FROM reviewer_assignments ra
            JOIN content c ON ra.article_id = c.id
            JOIN users u ON c.author_id = u.id
            LEFT JOIN categories cat ON c.category_id = cat.category_id
            LEFT JOIN users creator ON ra.assigned_by = creator.id
            LEFT JOIN editor_assignments ea ON c.id = ea.article_id AND ea.status = 'assigned'
            LEFT JOIN editors e ON ea.editor_id = e.id
            LEFT JOIN users e_user ON e.user_id = e_user.id
            WHERE ra.reviewer_id = ?
            ORDER BY ra.assigned_date DESC
        `;

        const [assignments]: any = await db.execute(query, [userId]);

        const formatted = assignments.map((a: any) => ({
            id: a.assignment_id,
            articleId: a.article_id,
            title: a.title,
            author: { name: a.author_name, id: a.author_id, role: 'Author' },
            category: a.category_name || 'Uncategorized',
            status: a.assignment_status,
            articleStatus: a.article_status,
            assignedDate: new Date(a.assigned_date).toLocaleDateString(),
            dueDate: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Deadline',
            manager: a.manager_name ? { name: a.manager_name, id: a.manager_id, role: 'Content Manager' } : null,
            editor: a.editor_name ? { name: a.editor_name, id: a.editor_id, role: 'Editor' } : null
        }));

        res.status(200).json({ status: 'success', data: formatted });

    } catch (error: any) {
        console.error('Get reviewer assignments error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch assignments' });
    }
};

export const updateAssignmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { assignmentId, status, feedback } = req.body; // status: 'accepted', 'rejected', 'completed'
        const userId = (req as any).user?.userId;
        const db: any = getDatabase();

        // Verify ownership
        const [exists]: any = await db.execute(
            'SELECT * FROM reviewer_assignments WHERE id = ? AND reviewer_id = ?',
            [assignmentId, userId]
        );

        if (exists.length === 0) {
            res.status(404).json({ status: 'error', message: 'Assignment not found' });
            return;
        }

        const assignment = exists[0];
        const articleId = assignment.article_id;

        // Update status
        await db.execute(
            'UPDATE reviewer_assignments SET status = ? WHERE id = ?',
            [status, assignmentId]
        );

        // Notify Content Manager (assigned_by)
        // If assigned_by is null, we might notify admin or just skip
        const managerId = assignment.assigned_by;
        if (managerId) {
            await db.execute(
                `INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
                 VALUES (UUID(), ?, 'review_update', 'Review Status Updated', ?, ?, NOW())`,
                [managerId, `Reviewer updated status to ${status} for article ${articleId}`, `/cm-dashboard/reviewer-assignments`]
            );

            await db.execute(
                `INSERT INTO communications (id, sender_id, receiver_id, message, type, entity_type, entity_id, created_at)
                 VALUES (UUID(), ?, ?, ?, 'status_update', 'article', ?, NOW())`,
                [userId, managerId, `Detailed Feedback/Status: ${status}. ${feedback || ''}`, articleId]
            );
        }

        res.status(200).json({ status: 'success', message: 'Status updated successfully' });

    } catch (error: any) {
        console.error('Update reviewer assignment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update assignment' });
    }
};

export const getReviewerStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        const db: any = getDatabase();

        const [stats]: any = await db.execute(`
            SELECT 
                COUNT(*) as total_assigned,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as pending
            FROM reviewer_assignments
            WHERE reviewer_id = ?
        `, [userId]);

        res.status(200).json({ status: 'success', data: stats[0] });
    } catch (error: any) {
        console.error('Get reviewer stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
    }
};

export const getCommunications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { articleId } = req.query;
        const userId = (req as any).user?.userId;
        const db: any = getDatabase();

        // 1. Verify access (reviewer must be assigned to this article)
        if (articleId) {
            const [access]: any = await db.execute(
                'SELECT id FROM reviewer_assignments WHERE article_id = ? AND reviewer_id = ?',
                [articleId, userId]
            );
            if (access.length === 0) {
                res.status(403).json({ status: 'error', message: 'Not authorized for this article' });
                return;
            }
        }

        // 2. Fetch logs (where user is sender OR receiver OR it's a broadcast/log related to that article? 
        // For simplicity, fetch messages where this user is sender/receiver, optionally filtered by article)
        // AND ensure if it's article-scoped, we see it?
        // Let's stick to Sender/Receiver logic for direct messages.

        let query = `
            SELECT 
                c.id, c.message, c.created_at,
                s.name as sender_name, s.id as sender_id, s.role as sender_role,
                r.name as receiver_name, r.id as receiver_id
            FROM communications c
            JOIN users s ON c.sender_id = s.id
            JOIN users r ON c.receiver_id = r.id
            WHERE (c.sender_id = ? OR c.receiver_id = ?)
        `;
        const params = [userId, userId];

        if (articleId) {
            query += ` AND c.entity_type = 'article' AND c.entity_id = ?`;
            params.push(articleId as string);
        }

        query += ` ORDER BY c.created_at ASC`;

        const [logs]: any = await db.execute(query, params);

        // Format for frontend
        const formatted = logs.map((l: any) => ({
            id: l.id,
            text: l.message,
            from: l.sender_id === userId ? 'You' : l.sender_name,
            tag: l.sender_role, // Using role as tag for now
            timestamp: l.created_at
        }));

        res.status(200).json({ status: 'success', data: formatted });
    } catch (error: any) {
        console.error('Get reviewer comms error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch messages' });
    }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { receiverId, message, articleId } = req.body;
        const senderId = (req as any).user?.userId;
        const db: any = getDatabase();

        // Get Names
        const [sender]: any = await db.execute('SELECT name FROM users WHERE id = ?', [senderId]);
        const senderName = sender[0]?.name || 'Reviewer';

        const [receiver]: any = await db.execute('SELECT name, email FROM users WHERE id = ?', [receiverId]);
        if (receiver.length === 0) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }
        const receiverEmail = receiver[0].email;
        const receiverName = receiver[0].name;

        // Send Email
        const subject = `New Message from ${senderName} regarding Article ${articleId || ''}`;
        const body = `
            <h3>Hello ${receiverName},</h3>
            <p>You have a new message assigned to your review task:</p>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px;">${message}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Login to reply</a>
        `;
        await sendEmail(receiverEmail, subject, body);

        // Log
        await db.execute(
            `INSERT INTO communications (id, sender_id, receiver_id, message, type, entity_type, entity_id, created_at)
             VALUES (UUID(), ?, ?, ?, 'message', 'article', ?, NOW())`,
            [senderId, receiverId, message, articleId || null]
        );

        res.status(200).json({ status: 'success', message: 'Message sent' });
    } catch (error: any) {
        console.error('Send reviewer message error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send message' });
    }
};
