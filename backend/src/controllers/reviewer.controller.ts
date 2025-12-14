
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

        const formatted = assignments.map((a: any) => {
            // Calculate Priority
            let priority = 'Normal';
            if (a.due_date) {
                const now = new Date();
                const due = new Date(a.due_date);
                const diffTime = due.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 2) priority = 'Urgent';
                else if (diffDays <= 5) priority = 'High';
            }

            return {
                id: a.assignment_id,
                articleId: a.article_id,
                title: a.title,
                author: { name: a.author_name, id: a.author_id, role: 'Author' },
                category: a.category_name || 'Uncategorized',
                status: a.assignment_status,
                articleStatus: a.article_status,
                assignedDate: new Date(a.assigned_date).toLocaleDateString(),
                dueDate: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Deadline',
                priority,
                manager: a.manager_name ? { name: a.manager_name, id: a.manager_id, role: 'Content Manager' } : null,
                editor: a.editor_name ? { name: a.editor_name, id: a.editor_id, role: 'Editor' } : null
            };
        });

        res.status(200).json({ status: 'success', data: formatted });

    } catch (error: any) {
        console.error('Get reviewer assignments error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch assignments' });
    }
};

export const getReviewerStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        const db: any = getDatabase();

        const [rows]: any = await db.execute(`
            SELECT status, due_date 
            FROM reviewer_assignments
            WHERE reviewer_id = ?
        `, [userId]);

        const result = {
            total: 0,
            pending: 0,
            completed: 0,
            high_priority: 0,
            under_evaluation: 0
        };

        const now = new Date();

        rows.forEach((r: any) => {
            result.total++;

            if (r.status === 'completed') {
                result.completed++;
            } else if (r.status === 'assigned' || r.status === 'in_progress') {
                result.pending++;

                // Track 'under_evaluation' specifically if needed, or just map 'in_progress' to it
                if (r.status === 'in_progress') {
                    result.under_evaluation++;
                }

                // High Priority Logic: Due within 3 days
                if (r.due_date) {
                    const due = new Date(r.due_date);
                    const diffTime = due.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 3) {
                        result.high_priority++;
                    }
                }
            }
        });

        res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
        console.error('Get reviewer stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
    }
};

import { getStorageBucket, getSignedUrl } from "../utils/storage";

export const getReviewContent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Article ID
        const userId = (req as any).user?.userId;
        const db: any = getDatabase();

        // 1. Verify Assignment
        const [assignment]: any = await db.execute(
            'SELECT id, status FROM reviewer_assignments WHERE article_id = ? AND reviewer_id = ?',
            [id, userId]
        );

        if (assignment.length === 0) {
            res.status(403).json({ status: 'error', message: 'Not authorized for this review' });
            return;
        }

        // 2. Fetch Content
        const [contentRows]: any = await db.execute(`
            SELECT c.id, c.title, c.content as body, c.category_id, cat.name as category_name
            FROM content c
            LEFT JOIN categories cat ON c.category_id = cat.category_id
            WHERE c.id = ?
        `, [id]);

        if (contentRows.length === 0) {
            res.status(404).json({ status: 'error', message: 'Article not found' });
            return;
        }

        const article = contentRows[0];
        let fileUrl = null;

        // 3. Fetch Attachments & Handle URLs
        let attachments: any[] = [];
        try {
            const [attRows]: any = await db.execute(
                'SELECT id, filename, storage_path, public_url, mime_type, size_bytes FROM attachments WHERE article_id = ? ORDER BY uploaded_at ASC',
                [id]
            );

            for (const att of (attRows || [])) {
                let url = att.public_url;
                if (!url && att.storage_path) {
                    try {
                        const gcsPath = att.storage_path.startsWith('gcs/') ? att.storage_path.slice(4) : att.storage_path;
                        // Attempt to sign
                        try {
                            const signed = await getSignedUrl(gcsPath, 'read', 7 * 24 * 60 * 60 * 1000);
                            url = typeof signed === 'string' ? signed : (signed as any).url || (signed as any).publicUrl;
                        } catch (err) {
                            // Fallback to public URL assumption if signing fails (e.g. no creds)
                            console.warn(`Signing failed for ${att.filename}, assuming public bucket access`);
                            const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'readmint-app.firebasestorage.app';
                            url = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(gcsPath)}`;
                        }
                    } catch (e) {
                        console.warn('Error processing attachment path', e);
                    }
                }
                attachments.push({ ...att, url });
            }
        } catch (e) {
            console.warn('Error fetching attachments for review', e);
        }

        res.status(200).json({
            status: 'success',
            data: {
                ...article,
                attachments,
                file_url: attachments.length > 0 ? attachments[0].url : null
            }
        });

    } catch (error: any) {
        console.error('Get review content error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch content' });
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
        const managerId = assignment.assigned_by;
        if (managerId) {
            await db.execute(
                `INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
                 VALUES (UUID(), ?, 'review_update', 'Review Status Updated', ?, ?, NOW())`,
                [managerId, `Reviewer updated status to ${status} for article ${articleId}`, `/cm-dashboard/reviewer-assignments`]
            );

            // Use 'message' type instead of 'status_update' to avoid truncation/enum errors
            await db.execute(
                `INSERT INTO communications (id, sender_id, receiver_id, message, type, entity_type, entity_id, created_at)
                 VALUES (UUID(), ?, ?, ?, 'message', 'article', ?, NOW())`,
                [userId, managerId, `Detailed Feedback/Status: ${status}. ${feedback || ''}`, articleId]
            );
        }

        res.status(200).json({ status: 'success', message: 'Status updated successfully' });

    } catch (error: any) {
        console.error('Update reviewer assignment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update assignment' });
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

// Mock Plagiarism Check Service
export const checkPlagiarism = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Article ID
        const userId = (req as any).user?.userId;
        const db: any = getDatabase();

        // 1. Verify Assignment
        const [assignment]: any = await db.execute(
            'SELECT id FROM reviewer_assignments WHERE article_id = ? AND reviewer_id = ?',
            [id, userId]
        );

        if (assignment.length === 0) {
            res.status(403).json({ status: 'error', message: 'Not authorized' });
            return;
        }

        // 2. Check if a report exists or start a new one
        // For demo purposes, we will simulate a scan immediately
        const similarityScore = Math.floor(Math.random() * 30); // Random 0-30%
        const uniqueScore = 100 - similarityScore;

        const report = {
            similarity_score: similarityScore,
            unique_score: uniqueScore,
            matches: [
                { source: "Wikipedia - AI Ethics", url: "https://en.wikipedia.org/wiki/Ethics_of_artificial_intelligence", similarity: 5 },
                { source: "TechCrunch Article", url: "https://techcrunch.com/ai-future", similarity: 3 }
            ],
            scanned_at: new Date().toISOString()
        };

        // Upsert report
        await db.execute(
            `INSERT INTO plagiarism_reports (id, article_id, run_by, created_at, similarity_summary, status)
             VALUES (UUID(), ?, ?, NOW(), ?, 'completed')`,
            [id, userId, JSON.stringify(report)]
        );

        res.status(200).json({ status: 'success', message: 'Scan completed', data: report });

    } catch (error: any) {
        console.error('Plagiarism check error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to run plagiarism check' });
    }
};

export const getPlagiarismStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Article ID
        const db: any = getDatabase();

        const [rows]: any = await db.execute(
            'SELECT similarity_summary, created_at, status FROM plagiarism_reports WHERE article_id = ? ORDER BY created_at DESC LIMIT 1',
            [id]
        );

        if (rows.length === 0) {
            res.status(200).json({ status: 'success', data: null });
            return;
        }

        // Parse JSON if needed (though mysql2 usually handles JSON columns, safest to check)
        let summary = rows[0].similarity_summary;
        if (typeof summary === 'string') {
            try { summary = JSON.parse(summary); } catch (e) { }
        }

        res.status(200).json({ status: 'success', data: { ...rows[0], similarity_summary: summary } });

    } catch (error: any) {
        console.error('Get plagiarism status error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch report' });
    }
};
