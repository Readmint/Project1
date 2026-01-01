
import { Request, Response } from 'express';
import { executeQuery, getDoc, createDoc, updateDoc } from '../utils/firestore-helpers';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/mailer';
import { getSignedUrl } from '../utils/storage';

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;

        // Fetch assignments for reviewer
        const assignments = await executeQuery('reviewer_assignments', [
            { field: 'reviewer_id', op: '==', value: userId }
        ], undefined, { field: 'assigned_date', dir: 'desc' });

        const formatted = await Promise.all(assignments.map(async (a: any) => {
            // Fetch Article
            const article: any = await getDoc('content', a.article_id);
            if (!article) return null; // Skip if article missing

            // Fetch Author
            let authorName = 'Unknown';
            if (article.author_id) {
                const author: any = await getDoc('users', article.author_id);
                if (author) authorName = author.name;
            }

            // Fetch Manager (assigned_by)
            let managerName = 'Unknown';
            let managerId = null;
            if (a.assigned_by) {
                const manager: any = await getDoc('users', a.assigned_by);
                if (manager) {
                    managerName = manager.name;
                    managerId = manager.id;
                }
            }

            // Fetch Editor Assigment for this article (optional, finding ANY active editor)
            let editorName = null;
            let editorId = null;
            const editorAssigns = await executeQuery('editor_assignments', [
                { field: 'article_id', op: '==', value: a.article_id },
                { field: 'status', op: '==', value: 'assigned' }
            ]);

            if (editorAssigns.length > 0) {
                const ea: any = editorAssigns[0];
                const editor: any = await getDoc('editors', ea.editor_id);
                if (editor && editor.user_id) {
                    const eUser: any = await getDoc('users', editor.user_id);
                    if (eUser) {
                        editorName = eUser.name;
                        editorId = eUser.id;
                    }
                }
            }

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
                id: a.id,
                articleId: a.article_id,
                title: article.title,
                author: { name: authorName, id: article.author_id, role: 'Author' },
                category: article.category_id || 'Uncategorized', // category name fetch skipped for speed
                status: a.status,
                articleStatus: article.status,
                assignedDate: new Date(a.assigned_date).toLocaleDateString(),
                dueDate: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Deadline',
                priority,
                manager: managerId ? { name: managerName, id: managerId, role: 'Content Manager' } : null,
                editor: editorName ? { name: editorName, id: editorId, role: 'Editor' } : null
            };
        }));

        res.status(200).json({ status: 'success', data: formatted.filter(i => i !== null) });

    } catch (error: any) {
        logger.error('Get reviewer assignments error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch assignments' });
    }
};

export const getReviewerStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;

        const assignments = await executeQuery('reviewer_assignments', [
            { field: 'reviewer_id', op: '==', value: userId }
        ]);

        const result = {
            total: 0,
            pending: 0,
            completed: 0,
            high_priority: 0,
            under_evaluation: 0
        };

        const now = new Date();

        assignments.forEach((r: any) => {
            result.total++;

            if (r.status === 'completed') {
                result.completed++;
            } else if (r.status === 'assigned' || r.status === 'in_progress') {
                result.pending++;

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
        logger.error('Get reviewer stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
    }
};

export const getReviewContent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Article ID
        const userId = (req as any).user?.userId;

        // 1. Verify Assignment
        const assignments = await executeQuery('reviewer_assignments', [
            { field: 'article_id', op: '==', value: id },
            { field: 'reviewer_id', op: '==', value: userId }
        ]);

        if (assignments.length === 0) {
            res.status(403).json({ status: 'error', message: 'Not authorized for this review' });
            return;
        }

        // 2. Fetch Content
        const article: any = await getDoc('content', id);

        if (!article) {
            res.status(404).json({ status: 'error', message: 'Article not found' });
            return;
        }

        // 3. Fetch Attachments
        let attachments: any[] = [];
        try {
            const attRows = await executeQuery('attachments', [{ field: 'article_id', op: '==', value: id }]);
            // Sort manually
            attRows.sort((a: any, b: any) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());

            for (const attObj of attRows) {
                const att: any = attObj;
                let url = att.public_url;
                if (!url && att.storage_path) {
                    try {
                        const gcsPath = att.storage_path.startsWith('gcs/') ? att.storage_path.slice(4) : att.storage_path;
                        try {
                            const signed: any = await getSignedUrl(gcsPath, 'read', 7 * 24 * 60 * 60 * 1000);
                            url = typeof signed === 'string' ? signed : signed.url || signed.publicUrl;
                        } catch (err) {
                            console.warn(`Signing failed for ${att.filename}, assuming public bucket access`);
                            const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'readmint-app.firebasestorage.app';
                            url = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(gcsPath)}`;
                        }
                    } catch (e) {
                        logger.warn('Error processing attachment path', e);
                    }
                }
                attachments.push({ ...att, url });
            }
        } catch (e) {
            logger.warn('Error fetching attachments for review', e);
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
        logger.error('Get review content error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch content' });
    }
};

export const updateAssignmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { assignmentId, status, feedback } = req.body; // status: 'accepted', 'rejected', 'completed'
        const userId = (req as any).user?.userId;

        // Verify ownership
        const assignment: any = await getDoc('reviewer_assignments', assignmentId);

        if (!assignment || assignment.reviewer_id !== userId) {
            res.status(404).json({ status: 'error', message: 'Assignment not found or unauthorized' });
            return;
        }

        const articleId = assignment.article_id;

        // Update status
        await updateDoc('reviewer_assignments', assignmentId, { status });

        // Notify Content Manager (assigned_by)
        const managerId = assignment.assigned_by;
        if (managerId) {
            await createDoc('notifications', {
                user_id: managerId,
                type: 'review_update',
                title: 'Review Status Updated',
                message: `Reviewer updated status to ${status} for article ${articleId}`,
                link: `/cm-dashboard/reviewer-assignments`,
                created_at: new Date()
            });

            await createDoc('communications', {
                sender_id: userId,
                receiver_id: managerId,
                message: `Detailed Feedback/Status: ${status}. ${feedback || ''}`,
                type: 'message',
                entity_type: 'article',
                entity_id: articleId,
                created_at: new Date()
            });
        }

        res.status(200).json({ status: 'success', message: 'Status updated successfully' });

    } catch (error: any) {
        logger.error('Update reviewer assignment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update assignment' });
    }
};

export const getCommunications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { articleId } = req.query;
        const userId = (req as any).user?.userId;

        // 1. Verify access (reviewer must be assigned to this article)
        if (articleId) {
            const access = await executeQuery('reviewer_assignments', [
                { field: 'article_id', op: '==', value: articleId },
                { field: 'reviewer_id', op: '==', value: userId }
            ]);
            if (access.length === 0) {
                res.status(403).json({ status: 'error', message: 'Not authorized for this article' });
                return;
            }
        }

        // 2. Fetch logs
        // Current executeQuery helper doesn't support complex OR conditions natively in single query without multiple queries + merging.
        // We need: (sender_id == userId OR receiver_id == userId)
        // We'll fetch both and merge
        const sent = await executeQuery('communications', [{ field: 'sender_id', op: '==', value: userId }]);
        const received = await executeQuery('communications', [{ field: 'receiver_id', op: '==', value: userId }]);

        // Merge and dedup
        const allLogs = [...sent, ...received];
        // Deduplicate by ID
        const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values());


        let filteredLogs: any[] = uniqueLogs;

        if (articleId) {
            filteredLogs = filteredLogs.filter((l: any) => l.entity_type === 'article' && l.entity_id === articleId);
        }

        // Sort
        filteredLogs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Manual join for names (users)
        // To avoid N+1, fetch unique user IDs involved
        const userIds = new Set<string>();
        filteredLogs.forEach((l: any) => { userIds.add(l.sender_id); userIds.add(l.receiver_id); });

        const userMap = new Map<string, any>();
        for (const uid of userIds) {
            const u: any = await getDoc('users', uid);
            if (u) userMap.set(uid, u);
        }

        // Format for frontend
        const formatted = filteredLogs.map((l: any) => {
            const sender = userMap.get(l.sender_id);
            // const receiver = userMap.get(l.receiver_id);
            return {
                id: l.id,
                text: l.message,
                from: l.sender_id === userId ? 'You' : (sender ? sender.name : 'Unknown'),
                tag: sender ? sender.role : 'User',
                timestamp: l.created_at
            };
        });

        res.status(200).json({ status: 'success', data: formatted });
    } catch (error: any) {
        logger.error('Get reviewer comms error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch messages' });
    }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { receiverId, message, articleId } = req.body;
        const senderId = (req as any).user?.userId;

        // Get Names
        const sender: any = await getDoc('users', senderId);
        const senderName = sender?.name || 'Reviewer';

        const receiver: any = await getDoc('users', receiverId);
        if (!receiver) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }
        const receiverEmail = receiver.email;
        const receiverName = receiver.name;

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
        await createDoc('communications', {
            sender_id: senderId,
            receiver_id: receiverId,
            message,
            type: 'message',
            entity_type: 'article',
            entity_id: articleId || null,
            created_at: new Date()
        });

        res.status(200).json({ status: 'success', message: 'Message sent' });
    } catch (error: any) {
        logger.error('Send reviewer message error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send message' });
    }
};

// Mock Plagiarism Check Service
export const checkPlagiarism = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Article ID
        const userId = (req as any).user?.userId;

        // 1. Verify Assignment
        const assignments = await executeQuery('reviewer_assignments', [
            { field: 'article_id', op: '==', value: id },
            { field: 'reviewer_id', op: '==', value: userId }
        ]);

        if (assignments.length === 0) {
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

        // Upsert report: just create new one
        await createDoc('plagiarism_reports', {
            article_id: id,
            run_by: userId,
            similarity_summary: report,
            status: 'completed',
            created_at: new Date()
        });

        res.status(200).json({ status: 'success', message: 'Scan completed', data: report });

    } catch (error: any) {
        logger.error('Plagiarism check error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to run plagiarism check' });
    }
};

export const getPlagiarismStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Article ID

        const reports = await executeQuery('plagiarism_reports', [
            { field: 'article_id', op: '==', value: id }
        ], 1, { field: 'created_at', dir: 'desc' });

        if (reports.length === 0) {
            res.status(200).json({ status: 'success', data: null });
            return;
        }

        const row: any = reports[0];

        // Parse JSON if needed (Firestore stores object, but just in case)
        let summary = row.similarity_summary;
        if (typeof summary === 'string') {
            try { summary = JSON.parse(summary); } catch (e) { }
        }

        res.status(200).json({ status: 'success', data: { ...row, similarity_summary: summary } });

    } catch (error: any) {
        logger.error('Get plagiarism status error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch report' });
    }
};
