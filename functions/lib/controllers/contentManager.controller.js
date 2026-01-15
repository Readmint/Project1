"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishContent = exports.getReadyToPublish = exports.getSubmissionDetails = exports.checkPlagiarism = exports.getDashboardStats = exports.sendMessage = exports.getNotifications = exports.getCommunications = exports.unassignEditor = exports.assignReviewer = exports.assignEditor = exports.getReviewers = exports.getEditors = exports.getSubmissions = void 0;
const firestore_helpers_1 = require("../utils/firestore-helpers");
const logger_1 = require("../utils/logger");
const mailer_1 = require("../utils/mailer");
const string_similarity_1 = __importDefault(require("string-similarity"));
// Using require to bypass strict TS module resolution issues with some packages
const { search } = require('google-sr');
const certificate_controller_1 = require("./certificate.controller");
const getSubmissions = async (req, res) => {
    try {
        // Fetch all content where status is one of the submitted states
        // In Firestore, "IN" query is supported up to 10 values.
        const submittedStatuses = ['submitted', 'under_review', 'changes_requested', 'approved', 'rejected'];
        // executeQuery wrapper might not support 'in' natively in my implementation yet?
        // My implementation: filters.forEach(f => query.where(f.field, f.op, f.value))
        // Firestore supports 'in'.
        // Let's assume my helper passes 'in' correctly.
        const submissions = await (0, firestore_helpers_1.executeQuery)('content', [
            { field: 'status', op: 'in', value: submittedStatuses }
        ], undefined, { field: 'created_at', dir: 'desc' });
        const formattedSubmissions = await Promise.all(submissions.map(async (sub) => {
            // Fetch Author
            let authorName = 'Unknown';
            if (sub.author_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', sub.author_id);
                if (u)
                    authorName = u.name;
            }
            // Fetch Category
            const categoryName = sub.category_id || 'Uncategorized'; // Manual fetch if we had category names mapping
            // Fetch Editor Assignment (active)
            let assignedEditor = null;
            let priority = 'Normal';
            const editorAssigns = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
                { field: 'article_id', op: '==', value: sub.id },
                { field: 'status', op: '!=', value: 'cancelled' }
            ]);
            // Note: '!=' query needs index or plain filtering.
            // If helpers support it. If not, fetch all assignments for article?
            // Safest: fetch all assignments for article, filter in JS.
            // Or simpler: just query status 'assigned' or 'in_progress'
            // Querying 'status' IN ['assigned', 'in_progress'] ?
            const activeAssignment = editorAssigns.find((ea) => ['assigned', 'in_progress'].includes(ea.status));
            if (activeAssignment) {
                // Fetch editor name
                const ed = await (0, firestore_helpers_1.getDoc)('editors', activeAssignment.editor_id);
                if (ed) {
                    const edu = await (0, firestore_helpers_1.getDoc)('users', ed.user_id);
                    if (edu)
                        assignedEditor = edu.name;
                }
                // Priority check? Stored on assignment? "ea.priority" was in SQL join. 
                // If not in schema, default Normal.
            }
            const toDate = (d) => {
                if (!d)
                    return new Date();
                try {
                    return d.toDate ? d.toDate() : new Date(d);
                }
                catch (e) {
                    return new Date();
                }
            };
            return {
                id: sub.id,
                title: sub.title,
                author: authorName,
                category: categoryName,
                date: toDate(sub.created_at).toLocaleDateString(), // Consider moving format to frontend
                status: sub.status,
                priority: priority,
                assignedEditor: assignedEditor,
                fileUrl: sub.public_url || null
            };
        }));
        res.status(200).json({
            status: 'success',
            data: formattedSubmissions
        });
    }
    catch (error) {
        logger_1.logger.error('Get submissions error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch submissions' });
    }
};
exports.getSubmissions = getSubmissions;
const getEditors = async (req, res) => {
    try {
        const editors = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'role', op: '==', value: 'editor' }]);
        // We also need their 'editor_id' from 'editors' collection
        // But in my schema, 'editors' collection doc ID might be user_id or auto.
        // Let's assume we need to join.
        const validEditors = await Promise.all(editors.map(async (u) => {
            // Find editor profile
            const profiles = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: u.id }]);
            let editorId = profiles.length > 0 ? profiles[0].id : null;
            if (!editorId) {
                // Auto-heal: Create editor profile if missing
                try {
                    const newProfile = await (0, firestore_helpers_1.createDoc)('editors', {
                        user_id: u.id,
                        specialization: 'General',
                        capacity: 5,
                        active_assignments: 0,
                        created_at: new Date()
                    });
                    editorId = newProfile.id;
                }
                catch (e) {
                    logger_1.logger.error(`Failed to auto-create editor profile for ${u.id}`, e);
                }
            }
            return {
                name: u.name,
                id: editorId, // editor profile id
                user_id: u.id
            };
        }));
        res.status(200).json({
            status: 'success',
            data: validEditors // No need to filter nulls if we handle creation or accept nulls temporarily
        });
    }
    catch (error) {
        logger_1.logger.error('Get editors error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch editors' });
    }
};
exports.getEditors = getEditors;
const getReviewers = async (req, res) => {
    try {
        const reviewers = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'role', op: '==', value: 'reviewer' }]);
        const reviewerData = reviewers.map((r) => ({
            name: r.name,
            user_id: r.id
        }));
        res.status(200).json({
            status: 'success',
            data: reviewerData
        });
    }
    catch (error) {
        logger_1.logger.error('Get reviewers error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch reviewers' });
    }
};
exports.getReviewers = getReviewers;
const assignEditor = async (req, res) => {
    var _a;
    try {
        const { submissionId, editorName } = req.body;
        const managerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        let managerName = 'Content Manager';
        if (managerId) {
            const m = await (0, firestore_helpers_1.getDoc)('users', managerId);
            if (m)
                managerName = m.name;
        }
        // Find editor user by name (inefficient but legacy compatible)
        const users = await (0, firestore_helpers_1.executeQuery)('users', [
            { field: 'name', op: '==', value: editorName },
            { field: 'role', op: '==', value: 'editor' }
        ]);
        if (users.length === 0) {
            res.status(404).json({ status: 'error', message: 'Editor not found' });
            return;
        }
        const editorUser = users[0];
        // find editor profile
        const editorProfiles = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: editorUser.id }]);
        let editorProfileId;
        if (editorProfiles.length === 0) {
            // Auto-create
            const newProfile = await (0, firestore_helpers_1.createDoc)('editors', {
                user_id: editorUser.id,
                specialization: 'General',
                capacity: 5,
                active_assignments: 0,
                created_at: new Date()
            });
            editorProfileId = newProfile.id;
        }
        else {
            editorProfileId = editorProfiles[0].id;
        }
        // Create assignment
        await (0, firestore_helpers_1.createDoc)('editor_assignments', {
            editor_id: editorProfileId,
            article_id: submissionId,
            assigned_by: managerId || null,
            status: 'assigned',
            assigned_date: new Date()
        });
        // Update content status
        await (0, firestore_helpers_1.updateDoc)('content', submissionId, { status: 'under_review' });
        // Email
        const emailSubject = `New Article Assignment: ${submissionId}`;
        const emailBody = `
          <h3>Hello,</h3>
          <p>You have been assigned to edit the article: <b>${submissionId}</b>.</p>
          <p><b>Assigned by:</b> ${managerName}</p>
          <p>Please log in to your dashboard to review it.</p>
          <br/>
          <p>Best regards,<br/>MindRadix Team</p>
        `;
        await (0, mailer_1.sendEmail)(editorUser.email, emailSubject, emailBody);
        // Notify
        await (0, firestore_helpers_1.createDoc)('notifications', {
            user_id: editorUser.id,
            type: 'assignment',
            title: 'New Article Assignment',
            message: `You have been assigned to edit article: ${submissionId}`,
            link: `/editor/dashboard/assignments`,
            created_at: new Date()
        });
        if (managerId) {
            await (0, firestore_helpers_1.createDoc)('communications', {
                sender_id: managerId,
                receiver_id: editorUser.id,
                message: `Assigned article ${submissionId} to ${editorName}`,
                type: 'assignment',
                entity_type: 'article',
                entity_id: submissionId,
                created_at: new Date()
            });
        }
        res.status(200).json({
            status: 'success',
            message: 'Editor assigned successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Assign editor error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to assign editor' });
    }
};
exports.assignEditor = assignEditor;
const assignReviewer = async (req, res) => {
    var _a;
    try {
        const { submissionId, reviewerName, deadline } = req.body;
        const managerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        let managerName = 'Content Manager';
        if (managerId) {
            const m = await (0, firestore_helpers_1.getDoc)('users', managerId);
            if (m)
                managerName = m.name;
        }
        const users = await (0, firestore_helpers_1.executeQuery)('users', [
            { field: 'name', op: '==', value: reviewerName },
            { field: 'role', op: '==', value: 'reviewer' }
        ]);
        if (users.length === 0) {
            res.status(404).json({ status: 'error', message: 'Reviewer not found' });
            return;
        }
        const reviewerUser = users[0];
        await (0, firestore_helpers_1.createDoc)('reviewer_assignments', {
            reviewer_id: reviewerUser.id,
            article_id: submissionId,
            assigned_by: managerId || null,
            status: 'assigned',
            due_date: deadline || null,
            assigned_date: new Date()
        });
        const emailSubject = `New Review Assignment: ${submissionId}`;
        const emailBody = `
          <h3>Hello,</h3>
          <p>You have been assigned to review the article: <b>${submissionId}</b>.</p>
          <p><b>Assigned by:</b> ${managerName}</p>
          <p>Deadline: ${deadline || 'Not specified'}</p>
          <p>Please log in to your dashboard to start the review.</p>
          <br/>
          <p>Best regards,<br/>MindRadix Team</p>
        `;
        await (0, mailer_1.sendEmail)(reviewerUser.email, emailSubject, emailBody);
        await (0, firestore_helpers_1.createDoc)('notifications', {
            user_id: reviewerUser.id,
            type: 'assignment',
            title: 'New Review Assignment',
            message: `You have been assigned to review article: ${submissionId}`,
            link: `/reviewer/dashboard/assignments`,
            created_at: new Date()
        });
        if (managerId) {
            await (0, firestore_helpers_1.createDoc)('communications', {
                sender_id: managerId,
                receiver_id: reviewerUser.id,
                message: `Assigned review for article ${submissionId} to ${reviewerName}`,
                type: 'assignment',
                entity_type: 'article',
                entity_id: submissionId,
                created_at: new Date()
            });
        }
        res.status(200).json({
            status: 'success',
            message: 'Reviewer assigned successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Assign reviewer error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to assign reviewer' });
    }
};
exports.assignReviewer = assignReviewer;
const unassignEditor = async (req, res) => {
    var _a;
    try {
        const { submissionId } = req.body;
        const managerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // Cancel assignments
        const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
            { field: 'article_id', op: '==', value: submissionId },
            { field: 'status', op: '==', value: 'assigned' }
        ]);
        for (const assign of assignments) {
            await (0, firestore_helpers_1.updateDoc)('editor_assignments', assign.id, { status: 'cancelled' });
        }
        await (0, firestore_helpers_1.updateDoc)('content', submissionId, { status: 'submitted' });
        if (managerId) {
            await (0, firestore_helpers_1.createDoc)('communications', {
                sender_id: managerId,
                receiver_id: managerId,
                message: `Unassigned editor from article ${submissionId}`,
                type: 'assignment',
                entity_type: 'article',
                entity_id: submissionId,
                created_at: new Date()
            });
        }
        res.status(200).json({
            status: 'success',
            message: 'Editor unassigned successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Unassign editor error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to unassign editor' });
    }
};
exports.unassignEditor = unassignEditor;
const getCommunications = async (req, res) => {
    try {
        // Fetch recent communications
        const logs = await (0, firestore_helpers_1.executeQuery)('communications', [], 50, { field: 'created_at', dir: 'desc' });
        // Manual join
        const formatted = await Promise.all(logs.map(async (l) => {
            let senderName = 'Unknown';
            if (l.sender_id) {
                const s = await (0, firestore_helpers_1.getDoc)('users', l.sender_id);
                if (s)
                    senderName = s.name;
            }
            let receiverName = 'Unknown';
            if (l.receiver_id) {
                const r = await (0, firestore_helpers_1.getDoc)('users', l.receiver_id);
                if (r)
                    receiverName = r.name;
            }
            return {
                id: l.id,
                message: l.message,
                created_at: l.created_at,
                type: l.type,
                sender_name: senderName,
                receiver_name: receiverName
            };
        }));
        res.status(200).json({ status: 'success', data: formatted });
    }
    catch (error) {
        logger_1.logger.error('Get communications error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch communications' });
    }
};
exports.getCommunications = getCommunications;
const getNotifications = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const notifs = await (0, firestore_helpers_1.executeQuery)('notifications', [
            { field: 'user_id', op: '==', value: userId }
        ], 50, { field: 'created_at', dir: 'desc' });
        res.status(200).json({ status: 'success', data: notifs });
    }
    catch (error) {
        logger_1.logger.error('Get notifications error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
const sendMessage = async (req, res) => {
    var _a;
    try {
        const { receiverId, message, subject } = req.body;
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        let senderName = 'Content Manager';
        if (senderId) {
            const s = await (0, firestore_helpers_1.getDoc)('users', senderId);
            if (s)
                senderName = s.name;
        }
        const receiver = await (0, firestore_helpers_1.getDoc)('users', receiverId);
        if (!receiver) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }
        const emailSubject = subject || `New Message from ${senderName}`;
        const emailBody = `
            <h3>Hello ${receiver.name},</h3>
            <p>You have received a new message:</p>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px;">${message}</p>
            <br/>
            <p>Best regards,<br/>MindRadix Team</p>
        `;
        await (0, mailer_1.sendEmail)(receiver.email, emailSubject, emailBody);
        await (0, firestore_helpers_1.createDoc)('communications', {
            sender_id: senderId,
            receiver_id: receiverId,
            message,
            type: 'message',
            entity_type: 'user',
            entity_id: receiverId,
            created_at: new Date()
        });
        res.status(200).json({ status: 'success', message: 'Message sent successfully' });
    }
    catch (error) {
        logger_1.logger.error('Send message error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send message' });
    }
};
exports.sendMessage = sendMessage;
const getDashboardStats = async (req, res) => {
    try {
        // Parallel counts
        const [totalSubmissions, submitted, underReview, changesRequested, approved, published] = await Promise.all([
            (0, firestore_helpers_1.getCount)('content', []),
            (0, firestore_helpers_1.getCount)('content', [{ field: 'status', op: '==', value: 'submitted' }]),
            (0, firestore_helpers_1.getCount)('content', [{ field: 'status', op: '==', value: 'under_review' }]),
            (0, firestore_helpers_1.getCount)('content', [{ field: 'status', op: '==', value: 'changes_requested' }]),
            (0, firestore_helpers_1.getCount)('content', [{ field: 'status', op: '==', value: 'approved' }]),
            (0, firestore_helpers_1.getCount)('content', [{ field: 'status', op: '==', value: 'published' }])
        ]);
        // Editor Queue
        // status IN assigned, in_progress. getCount handles single operator.
        // We'll simulate OR with 2 queries? Or just 1 if we can.
        // Or fetch all editor_assignments with status=assigned and status=in_progress and count unique article_id.
        // getCount only takes 1 filter set (AND). 
        // We can do: getCount('editor_assignments', [{status: assigned}]) + getCount('editor_assignments', [{status: in_progress}])
        // Actually unique article_id logic is redundant if we assume 1 active assignment per article usually.
        const q1 = await (0, firestore_helpers_1.getCount)('editor_assignments', [{ field: 'status', op: '==', value: 'assigned' }]);
        const q2 = await (0, firestore_helpers_1.getCount)('editor_assignments', [{ field: 'status', op: '==', value: 'in_progress' }]);
        const editorQueue = q1 + q2;
        const upcoming = await (0, firestore_helpers_1.executeQuery)('content', [{ field: 'status', op: '==', value: 'approved' }], 5, { field: 'created_at', dir: 'asc' });
        const recent = await (0, firestore_helpers_1.executeQuery)('content', [], 5, { field: 'created_at', dir: 'desc' });
        // Manual expand recent
        const recentExpanded = await Promise.all(recent.map(async (r) => {
            let authorName = 'Unknown';
            if (r.author_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', r.author_id);
                if (u)
                    authorName = u.name;
            }
            return {
                id: r.id,
                title: r.title,
                author: authorName,
                date: new Date(r.created_at).toLocaleDateString(),
                status: r.status,
                priority: 'Normal'
            };
        }));
        const dashboardData = {
            stats: [
                { label: "Total Submissions", value: totalSubmissions, description: "All-time submissions" },
                { label: "Pending Assignments", value: submitted, description: "Awaiting assignment" },
                { label: "Under Review", value: underReview, description: "Actively being reviewed" },
                { label: "Changes Requested", value: changesRequested, description: "Awaiting author changes" },
                { label: "Editor Queue", value: editorQueue, description: "Waiting for editing" },
                { label: "Ready to Publish", value: approved, description: "Cleared by QC" },
                { label: "Published", value: published, description: "Live articles" },
            ],
            recentSubmissions: recentExpanded,
            upcomingPublications: upcoming.map((u) => ({
                title: u.title,
                date: new Date(u.created_at).toLocaleDateString(),
                time: new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                visibility: 'Scheduled'
            }))
        };
        res.status(200).json({ status: 'success', data: dashboardData });
    }
    catch (error) {
        logger_1.logger.error('Get dashboard stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const checkPlagiarism = async (req, res) => {
    try {
        const { content, articleId } = req.body;
        if (!content || content.length < 50) {
            res.status(400).json({ status: 'error', message: 'Content is too short to check.' });
            return;
        }
        // 1. Internal Database Check
        // Fetch all published articles (or all content)
        // Optimization: limit fields to content? helpers get full doc.
        // Limit: 50? If too many articles, this will be slow.
        // For MVP/Demo: fetch last 50 articles.
        const articles = await (0, firestore_helpers_1.executeQuery)('content', [], 50, { field: 'created_at', dir: 'desc' });
        let internalScore = 0;
        let matchedInternalArticle = null;
        if (articles.length > 0) {
            const corpus = articles.map((a) => a.content || '');
            // exclude current article?
            const result = string_similarity_1.default.findBestMatch(content, corpus);
            // check if best match is self?
            // Not easily checked unless we match ID.
            // We can filter `articles` before mapping.
            internalScore = Math.round(result.bestMatch.rating * 100);
            matchedInternalArticle = articles[result.bestMatchIndex];
            if (articleId && matchedInternalArticle.id === articleId) {
                // matched self
                internalScore = 0; // ignore self
            }
        }
        // 2. External Web Check (Spot Check)
        let externalScore = 0;
        let externalSource = null;
        // Split content into clean sentences
        const sentences = content.match(/[^\.!\?]+[\.!\?]+/g) || [content];
        const validSentences = sentences
            .map((s) => s.trim())
            .filter((s) => s.split(' ').length > 8 && s.split(' ').length < 30); // 8-30 words
        // Pick up to 2 random "fingerprints" to search
        const fingerprints = validSentences.sort(() => 0.5 - Math.random()).slice(0, 2);
        if (fingerprints.length > 0) {
            try {
                // Parallel search using google-sr
                const searchResults = await Promise.all(fingerprints.map((fp) => search({ query: `"${fp}"`, safeMode: true, limit: 1 })));
                for (let i = 0; i < searchResults.length; i++) {
                    const results = searchResults[i];
                    if (results && results.length > 0) {
                        // Found a match for the quoted string
                        externalScore += 45;
                        if (!externalSource)
                            externalSource = results[0].link || 'Web Source';
                    }
                }
            }
            catch (err) {
                logger_1.logger.warn("External check failed:", err);
            }
        }
        // Combine scores (prioritize highest)
        const finalScore = Math.min(Math.max(internalScore, externalScore), 100);
        let matchData = null;
        if (internalScore > externalScore && internalScore > 5 && matchedInternalArticle) {
            matchData = {
                type: 'internal',
                title: matchedInternalArticle.title,
                id: matchedInternalArticle.id,
                percentage: internalScore
            };
        }
        else if (externalScore > 0) {
            matchData = {
                type: 'web',
                title: 'External Web Source',
                url: externalSource || 'Multiple sources detected',
                percentage: externalScore
            };
        }
        res.status(200).json({
            status: 'success',
            score: finalScore,
            match: matchData
        });
    }
    catch (error) {
        logger_1.logger.error('Plagiarism check error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to perform plagiarism check' });
    }
};
exports.checkPlagiarism = checkPlagiarism;
const getSubmissionDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await (0, firestore_helpers_1.getDoc)('content', id);
        if (!article) {
            res.status(404).json({ status: 'error', message: 'Submission not found' });
            return;
        }
        // Manual join author
        let authorName = 'Unknown';
        if (article.author_id) {
            const u = await (0, firestore_helpers_1.getDoc)('users', article.author_id);
            if (u)
                authorName = u.name;
        }
        const events = [];
        events.push({
            step: 'DRAFT',
            date: article.created_at,
            description: 'Initial draft created.'
        });
        if (article.status !== 'draft') {
            events.push({
                step: 'SUBMITTED',
                date: article.created_at,
                description: 'Submitted for review.'
            });
        }
        const editorAssigns = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [{ field: 'article_id', op: '==', value: id }]);
        for (const ea of editorAssigns) {
            const e = ea;
            if (e.status !== 'cancelled') {
                // fetch editor user name
                let eName = 'Editor';
                const ed = await (0, firestore_helpers_1.getDoc)('editors', e.editor_id);
                if (ed) {
                    const edu = await (0, firestore_helpers_1.getDoc)('users', ed.user_id);
                    if (edu)
                        eName = edu.name;
                }
                events.push({
                    step: 'ASSIGNED',
                    date: e.assigned_date,
                    description: `Assigned to Editor ${eName}.`
                });
            }
        }
        const reviewerAssigns = await (0, firestore_helpers_1.executeQuery)('reviewer_assignments', [{ field: 'article_id', op: '==', value: id }]);
        for (const ra of reviewerAssigns) {
            const r = ra;
            if (r.status !== 'cancelled') {
                let rName = 'Reviewer';
                const ru = await (0, firestore_helpers_1.getDoc)('users', r.reviewer_id);
                if (ru)
                    rName = ru.name;
                events.push({
                    step: 'ASSIGNED',
                    date: r.assigned_date,
                    description: `Assigned to Reviewer ${rName}.`
                });
            }
        }
        const logs = await (0, firestore_helpers_1.executeQuery)('communications', [
            { field: 'entity_id', op: '==', value: id },
            { field: 'entity_type', op: '==', value: 'article' }
        ], undefined, { field: 'created_at', dir: 'asc' });
        logs.forEach((log) => {
            if (log.message && log.message.includes('Unassigned')) {
                events.push({
                    step: 'UNASSIGNED',
                    date: log.created_at,
                    description: log.message
                });
            }
        });
        if (article.status === 'approved' || article.status === 'published') {
            events.push({
                step: 'APPROVED',
                date: new Date(), // Ideally fetch from workflow_events if recorded
                description: 'Passed QC & approved.'
            });
        }
        if (article.status === 'published') {
            events.push({
                step: 'PUBLISHED',
                date: new Date(),
                description: 'Article published successfully.'
            });
        }
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const attachments = await (0, firestore_helpers_1.executeQuery)('attachments', [{ field: 'article_id', op: '==', value: id }]);
        res.status(200).json({
            status: 'success',
            data: {
                article: {
                    id: article.id,
                    title: article.title,
                    author: authorName,
                    status: article.status,
                    category: article.category_id || 'Uncategorized',
                    content: article.content
                },
                timeline: events,
                attachments: attachments || []
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get submission details error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch submission details' });
    }
};
exports.getSubmissionDetails = getSubmissionDetails;
const getReadyToPublish = async (req, res) => {
    try {
        const articles = await (0, firestore_helpers_1.executeQuery)('content', [
            { field: 'status', op: 'in', value: ['approved', 'Approved'] }
        ], undefined, { field: 'created_at', dir: 'asc' });
        const formatted = await Promise.all(articles.map(async (c) => {
            let authorName = 'Unknown';
            if (c.author_id) {
                const u = await (0, firestore_helpers_1.getDoc)('users', c.author_id);
                if (u)
                    authorName = u.name;
            }
            return {
                id: c.id,
                title: c.title,
                author: authorName,
                created_at: c.created_at,
                category_id: c.category_id,
                category_name: c.category_id || 'General'
            };
        }));
        res.status(200).json({ status: 'success', data: formatted });
    }
    catch (error) {
        logger_1.logger.error('Get ready to publish error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch publishing queue' });
    }
};
exports.getReadyToPublish = getReadyToPublish;
const publishContent = async (req, res) => {
    var _a;
    try {
        const { articleId, price, isFree } = req.body;
        const managerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // Validate
        if (!isFree && (price === undefined || price < 0)) {
            res.status(400).json({ status: 'error', message: 'Invalid price for paid content' });
            return;
        }
        // Update Content
        const art = await (0, firestore_helpers_1.updateDoc)('content', articleId, {
            status: 'published',
            price: isFree ? 0 : price,
            is_free: isFree,
            published_at: new Date()
        });
        const title = art.title || 'New Article';
        // Notify Author
        if (art.author_id) {
            await (0, firestore_helpers_1.createDoc)('notifications', {
                user_id: art.author_id,
                type: 'publication',
                title: 'Article Published!',
                message: `Your article "${title}" is now live!`,
                link: `/reader/article/${articleId}`,
                created_at: new Date()
            });
        }
        // Broadcast to Readers (Limit to first 50 active readers for MVP)
        // In real app, use Pub/Sub or batch
        const readers = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'role', op: '==', value: 'reader' }], 50);
        for (const r of readers) {
            const reader = r;
            await (0, firestore_helpers_1.createDoc)('notifications', {
                user_id: reader.id,
                type: 'publication',
                title: 'New Magazine Entry',
                message: `New article "${title}" has been released.`,
                link: `/reader/article/${articleId}`,
                created_at: new Date()
            });
        }
        // Log action
        if (managerId) {
            await (0, firestore_helpers_1.createDoc)('communications', {
                sender_id: managerId,
                receiver_id: managerId,
                message: `Published article ${articleId} (Price: ${isFree ? 'Free' : price})`,
                type: 'system',
                entity_type: 'article',
                entity_id: articleId,
                created_at: new Date()
            });
        }
        // Generate Certificate
        if (art.author_id) {
            try {
                await (0, certificate_controller_1.createAndSendCertificate)(articleId);
                logger_1.logger.info(`Certificate generated for article ${articleId}`);
            }
            catch (certErr) {
                logger_1.logger.error('Certificate generation failed (non-blocking):', certErr);
            }
        }
        res.status(200).json({ status: 'success', message: 'Article published successfully' });
    }
    catch (error) {
        logger_1.logger.error('Publish content error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to publish content' });
    }
};
exports.publishContent = publishContent;
//# sourceMappingURL=contentManager.controller.js.map