"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getContentManagers = exports.getCommunications = exports.getEditorAnalytics = exports.restoreVersion = exports.getVersionById = exports.getVersions = exports.approveForPublishing = exports.requestAuthorChanges = exports.finalizeEditing = exports.saveDraft = exports.getArticleForEdit = exports.getSubmittedForEditor = exports.getAssignedForEditor = exports.uploadEditorResume = exports.saveEditorProfile = exports.getEditorProfile = void 0;
const uuid_1 = require("uuid");
const express_validator_1 = require("express-validator");
// import { getDatabase } from "../config/database";
const logger_1 = require("../utils/logger");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const stream_1 = __importDefault(require("stream"));
const storage_1 = require("../utils/storage");
const mailer_1 = require("../utils/mailer");
const firestore_helpers_1 = require("../utils/firestore-helpers");
/**
 * Auth guard
 */
const requireAuth = (req, res) => {
    if (!req.user || !req.user.userId) {
        res.status(401).json({ status: "error", message: "Unauthorized" });
        return false;
    }
    return true;
};
/* ==============================
   PROFILE: GET /editor/profile
   PROFILE: POST /editor/profile
   ============================== */
/* ==============================
   PROFILE: GET /editor/profile
   PROFILE: POST /editor/profile
   ============================== */
const getEditorProfile = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        // attempt to fetch editor row
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        if (!editorDocs || editorDocs.length === 0) {
            // fetch user to get email
            const user = await (0, firestore_helpers_1.getDoc)('users', userId);
            // return minimal profile structure
            res.status(200).json({
                status: "success",
                data: {
                    user_id: userId,
                    email: user ? user.email : null,
                    display_name: null,
                    profile_photo_url: null,
                    fields: [],
                    experience_months: 0,
                    is_active: true,
                    resume_url: null,
                    resume_name: null,
                },
            });
            return;
        }
        const profile = editorDocs[0];
        // Attach email from user record
        const user = await (0, firestore_helpers_1.getDoc)('users', userId);
        if (user)
            profile.email = user.email;
        // Calculate stats
        try {
            // count assignments where editor_id == profile.id AND status == 'completed'
            const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
                { field: 'editor_id', op: '==', value: profile.id },
                { field: 'status', op: '==', value: 'completed' }
            ]);
            const reviewedCount = assignments.length;
            profile.stats = {
                ...(profile.stats || {}),
                articles: reviewedCount
            };
        }
        catch (err) {
            logger_1.logger.warn('Failed to calculate editor stats', err);
        }
        res.status(200).json({ status: "success", data: profile });
    }
    catch (err) {
        logger_1.logger.error("getEditorProfile error", err);
        res.status(500).json({ status: "error", message: "Failed to fetch profile", error: err?.message });
    }
};
exports.getEditorProfile = getEditorProfile;
const saveEditorProfile = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: "error", message: "Validation failed", errors: errors.array() });
            return;
        }
        const userId = req.user.userId;
        const { display_name, profile_photo_url, fields, experience_months, is_active, resume_url, resume_name, email, languages, } = req.body || {};
        // check if editor exists
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        let editorId = null;
        const dataToSave = {
            display_name: display_name || null,
            profile_photo_url: profile_photo_url || null,
            fields: fields || (languages ? { languages } : []),
            experience_months: typeof experience_months === "number" ? experience_months : 0,
            is_active: typeof is_active === "boolean" ? is_active : true,
            resume_url: resume_url || null,
            resume_name: resume_name || null,
            updated_at: new Date()
        };
        if (editorDocs.length > 0) {
            // update
            editorId = editorDocs[0].id;
            // We only update fields that are provided? Or overwrite? 
            // SQL COALESCE implies overwrite if provided, strict update.
            // JS object spread acts as COALESCE if we construct it carefully.
            // But here we constructed dataToSave with defaults/nulls. 
            // Let's rely on Firestore update behavior (only fields in object).
            // actually we want to merge, but we passed nulls for missing ones above? 
            // Re-constructing to match SQL logic:
            const updateData = { updated_at: new Date() };
            if (display_name !== undefined)
                updateData.display_name = display_name;
            if (profile_photo_url !== undefined)
                updateData.profile_photo_url = profile_photo_url;
            if (fields !== undefined)
                updateData.fields = fields;
            else if (languages !== undefined)
                updateData.fields = { languages };
            if (experience_months !== undefined)
                updateData.experience_months = experience_months;
            if (is_active !== undefined)
                updateData.is_active = is_active;
            if (resume_url !== undefined)
                updateData.resume_url = resume_url;
            if (resume_name !== undefined)
                updateData.resume_name = resume_name;
            await (0, firestore_helpers_1.updateDoc)('editors', editorId, updateData);
        }
        else {
            // create
            editorId = (0, uuid_1.v4)();
            await (0, firestore_helpers_1.createDoc)('editors', {
                user_id: userId,
                ...dataToSave,
                created_at: new Date()
            }, editorId);
        }
        // if email provided, update user
        if (typeof email !== "undefined" && email !== null && String(email).trim() !== "") {
            try {
                await (0, firestore_helpers_1.updateDoc)('users', userId, { email: String(email).trim() });
            }
            catch (e) {
                logger_1.logger.warn("saveEditorProfile: failed to update users.email", e);
            }
        }
        // Return saved
        const saved = await (0, firestore_helpers_1.getDoc)('editors', editorId);
        if (saved) {
            const u = await (0, firestore_helpers_1.getDoc)('users', userId);
            if (u)
                saved.email = u.email;
        }
        // log activity
        await (0, firestore_helpers_1.createDoc)('editor_activity', {
            editor_id: editorId,
            action: 'profile_update',
            action_detail: { updatedBy: userId },
            created_at: new Date()
        });
        res.status(200).json({ status: "success", message: "Profile saved", data: saved });
    }
    catch (err) {
        logger_1.logger.error("saveEditorProfile error", err);
        res.status(500).json({ status: "error", message: "Failed to save profile", error: err?.message });
    }
};
exports.saveEditorProfile = saveEditorProfile;
/* ==========================
   RESUME UPLOAD (uses src/utils/storage.ts)
   ========================== */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
    },
});
exports.uploadEditorResume = [
    upload.single("resume"),
    async (req, res) => {
        try {
            if (!requireAuth(req, res))
                return;
            const userId = req.user.userId;
            const file = req.file;
            if (!file) {
                res.status(400).json({ status: "error", message: "No resume uploaded" });
                return;
            }
            // Validate type
            const allowed = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
            if (!allowed.includes(file.mimetype)) {
                logger_1.logger.warn(`uploadEditorResume: unexpected mimetype ${file.mimetype} from user ${userId}`);
            }
            // storage path inside bucket
            const ext = path_1.default.extname(file.originalname) || ".pdf";
            const objectPath = `editors/${userId}/resumes/resume_${(0, uuid_1.v4)()}${ext}`;
            // upload buffer using the bucket returned by getStorageBucket()
            const bucket = (0, storage_1.getStorageBucket)();
            const storageFile = bucket.file(objectPath);
            const passthrough = new stream_1.default.PassThrough();
            passthrough.end(file.buffer);
            await new Promise((resolve, reject) => {
                const writeStream = storageFile.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                        metadata: {
                            uploadedBy: userId,
                            originalName: file.originalname,
                        },
                    },
                });
                passthrough.pipe(writeStream)
                    .on("finish", () => resolve())
                    .on("error", (err) => reject(err));
            });
            // generate signed URL (long-lived). getSignedUrl helper expects path & expiryMs
            const hundredYearsMs = 100 * 365 * 24 * 60 * 60 * 1000;
            const signedUrl = await (0, storage_1.getSignedUrl)(objectPath, "read", hundredYearsMs);
            // Save resume_url and resume_name in DB (editors)
            const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
            if (editorDocs.length === 0) {
                res.status(404).json({ status: "error", message: "Editor profile not found" });
                return;
            }
            const editorId = editorDocs[0].id;
            await (0, firestore_helpers_1.updateDoc)('editors', editorId, {
                resume_url: signedUrl,
                resume_name: file.originalname,
                updated_at: new Date()
            });
            // fetch saved row to return
            const saved = await (0, firestore_helpers_1.getDoc)('editors', editorId);
            // log activity
            await (0, firestore_helpers_1.createDoc)('editor_activity', {
                editor_id: editorId,
                action: 'upload_resume',
                action_detail: { uploadedBy: userId, object: objectPath },
                created_at: new Date()
            });
            res.status(200).json({
                status: "success",
                message: "Resume uploaded",
                data: { resume_url: signedUrl, resume_name: file.originalname, profile: saved },
            });
        }
        catch (err) {
            logger_1.logger.error("uploadEditorResume error", err);
            res.status(500).json({ status: "error", message: "Failed to upload resume", error: err?.message });
        }
    },
];
/* ==========================================
   ASSIGNMENTS / LISTING / GET ARTICLE FOR EDIT
   (the rest of your original controller methods)
   ========================================== */
const getAssignedForEditor = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        // resolve editor.id
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        if (editorDocs.length === 0) {
            res.status(200).json({ status: 'success', data: [] });
            return;
        }
        const editorId = editorDocs[0].id;
        // fetch in_progress or assigned
        const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
            { field: 'editor_id', op: '==', value: editorId },
            { field: 'status', op: 'in', value: ['assigned', 'in_progress'] }
        ]);
        // NOTE: 'in' operator supports max 10 values
        // Manual Join
        const results = await Promise.all(assignments.map(async (ea) => {
            const article = await (0, firestore_helpers_1.getDoc)('content', ea.article_id);
            if (!article)
                return null;
            let authorName = 'Unknown Author';
            if (article.author_id) {
                const authorUser = await (0, firestore_helpers_1.getDoc)('users', article.author_id);
                if (authorUser) {
                    authorName = authorUser.name || authorUser.email || 'Unknown Author';
                    // Try to fetch author profile for display_name
                    const authorProfile = await (0, firestore_helpers_1.executeQuery)('authors', [{ field: 'user_id', op: '==', value: article.author_id }]);
                    if (authorProfile.length > 0 && authorProfile[0].display_name) {
                        authorName = authorProfile[0].display_name;
                    }
                }
            }
            return {
                assignment_id: ea.id,
                article_id: ea.article_id,
                title: article.title,
                status: article.status,
                assigned_date: ea.assigned_date?.toDate ? ea.assigned_date.toDate() : ea.assigned_date,
                due_date: ea.due_date?.toDate ? ea.due_date.toDate() : ea.due_date,
                priority: ea.priority,
                assignment_status: ea.status,
                author_name: authorName
            };
        }));
        // Filter nulls and sort descending by assigned_date
        const validResults = results.filter(r => r !== null).sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime());
        res.status(200).json({ status: 'success', data: validResults });
    }
    catch (err) {
        logger_1.logger.error('getAssignedForEditor error', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch assignments', error: err?.message });
    }
};
exports.getAssignedForEditor = getAssignedForEditor;
const getSubmittedForEditor = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        // resolve editor.id
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        if (editorDocs.length === 0) {
            res.status(200).json({ status: 'success', data: [] });
            return;
        }
        const editorId = editorDocs[0].id;
        // Fetch assignments where status is completed
        const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
            { field: 'editor_id', op: '==', value: editorId },
            { field: 'status', op: '==', value: 'completed' }
        ]);
        // Manual Join
        const results = await Promise.all(assignments.map(async (ea) => {
            const article = await (0, firestore_helpers_1.getDoc)('content', ea.article_id);
            if (!article)
                return null;
            let authorName = 'Unknown Author';
            if (article.author_id) {
                const authorUser = await (0, firestore_helpers_1.getDoc)('users', article.author_id);
                if (authorUser) {
                    authorName = authorUser.name || authorUser.email || 'Unknown Author';
                    const authorProfile = await (0, firestore_helpers_1.executeQuery)('authors', [{ field: 'user_id', op: '==', value: article.author_id }]);
                    if (authorProfile.length > 0 && authorProfile[0].display_name) {
                        authorName = authorProfile[0].display_name;
                    }
                }
            }
            let categoryName = null;
            if (article.category_id) {
                // we store just category_id usually, but maybe we want name. 
                // If category_id IS the name (which it often is in previous code 'General' etc), use it.
                // If it's an ID, we might need to fetch categories collection? 
                // In SQL migration it was a join. Assuming category_id might be UUID or Name.
                // Let's assume it's just a string or we skip fetching category name if it's elaborate.
                categoryName = article.category_id;
            }
            return {
                assignment_id: ea.id,
                article_id: ea.article_id,
                title: article.title,
                article_status: article.status,
                assigned_date: ea.assigned_date?.toDate ? ea.assigned_date.toDate() : ea.assigned_date,
                due_date: ea.due_date?.toDate ? ea.due_date.toDate() : ea.due_date,
                priority: ea.priority,
                assignment_status: ea.status,
                completed_at: ea.updated_at?.toDate ? ea.updated_at.toDate() : ea.updated_at,
                category: categoryName,
                author_name: authorName
            };
        }));
        const validResults = results.filter((r) => r !== null).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
        res.status(200).json({ status: 'success', data: validResults });
    }
    catch (err) {
        logger_1.logger.error('getSubmittedForEditor error', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch submitted articles', error: err?.message });
    }
};
exports.getSubmittedForEditor = getSubmittedForEditor;
/**
 * Helper to normalize potential forms returned by getSignedUrl helper
 */
function normalizeSignedUrl(val) {
    if (!val)
        return null;
    if (typeof val === 'string')
        return val;
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string')
        return val[0];
    if (typeof val === 'object' && val !== null) {
        if (typeof val.url === 'string')
            return val.url;
        if (typeof val.publicUrl === 'string')
            return val.publicUrl;
        if (typeof val.public_url === 'string')
            return val.public_url;
    }
    return null;
}
/**
 * GET article for editor -> returns article + attachments (with signed read URLs when possible) + workflow events + reviews + versions
 */
const getArticleForEdit = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ status: 'error', message: 'Article id required' });
            return;
        }
        const article = await (0, firestore_helpers_1.getDoc)('content', id);
        if (!article) {
            res.status(404).json({ status: 'error', message: 'Article not found' });
            return;
        }
        // Attach author info
        // Default Unknown
        article.author_name = 'Unknown Author';
        article.author_email = null;
        if (article.author_id) {
            const u = await (0, firestore_helpers_1.getDoc)('users', article.author_id);
            if (u) {
                article.author_name = u.name || u.email || 'Unknown Author';
                article.author_email = u.email;
            }
            // Try author profile
            const authors = await (0, firestore_helpers_1.executeQuery)('authors', [{ field: 'user_id', op: '==', value: article.author_id }]);
            if (authors.length > 0 && authors[0].display_name) {
                article.author_name = authors[0].display_name;
            }
        }
        console.log(`[DEBUG] getArticleForEdit id=${id} author_id=${article.author_id} author_email=${article.author_email} author_name=${article.author_name}`);
        // permission: ensure editor assigned, or privileged roles
        const privileged = ['admin', 'content_manager'];
        const callerRole = req.user.role || '';
        if (!privileged.includes(callerRole)) {
            // check assignment
            // fetch editor id first
            const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
            if (editorDocs.length > 0) {
                const editorId = editorDocs[0].id;
                const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
                    { field: 'article_id', op: '==', value: id },
                    { field: 'editor_id', op: '==', value: editorId }
                ]);
                if (assignments.length === 0) {
                    res.status(403).json({ status: 'error', message: 'Forbidden: not assigned' });
                    return;
                }
            }
            else {
                // not an editor profile?
                res.status(403).json({ status: 'error', message: 'Forbidden: no editor profile' });
                return;
            }
        }
        // parse metadata safely (in Firestore it should be object, but legacy might be string if migrated raw?)
        // Firestore stores objects natively.
        if (typeof article.metadata === 'string') {
            try {
                article.metadata = JSON.parse(article.metadata);
            }
            catch (e) {
                article.metadata = {};
            }
        }
        else {
            article.metadata = article.metadata || {};
        }
        // Fetch attachments
        let attachments = [];
        try {
            const attRows = await (0, firestore_helpers_1.executeQuery)('attachments', [{ field: 'article_id', op: '==', value: id }]);
            // Sort in memory by uploaded_at if needed, but Firestore executes query order if index exists.
            // We didn't pass order to executeQuery yet.
            attRows.sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
            const bucket = (0, storage_1.getStorageBucket)();
            for (const attRow of attRows) {
                const att = attRow;
                const item = {
                    id: att.id,
                    filename: att.filename,
                    mime_type: att.mime_type,
                    size_bytes: att.size_bytes,
                    uploaded_by: att.uploaded_by,
                    uploaded_at: att.uploaded_at,
                    public_url: att.public_url || null,
                    signed_url: null,
                    storage_path: att.storage_path || null
                };
                try {
                    if (att.public_url) {
                        item.signed_url = att.public_url;
                    }
                    else if (att.storage_path) {
                        const gcsPath = att.storage_path.startsWith('gcs/') ? att.storage_path.slice(4) : att.storage_path;
                        try {
                            const readSigned = await (0, storage_1.getSignedUrl)(gcsPath, 'read', 7 * 24 * 60 * 60 * 1000); // 7 days
                            const normalized = normalizeSignedUrl(readSigned);
                            if (normalized) {
                                item.signed_url = normalized;
                            }
                            else {
                                // fallback public
                                try {
                                    await bucket.file(gcsPath).makePublic();
                                    const bucketName = bucket.name || process.env.FIREBASE_STORAGE_BUCKET;
                                    item.signed_url = `https://storage.googleapis.com/${bucketName}/${encodeURI(gcsPath)}`;
                                    try {
                                        await (0, firestore_helpers_1.updateDoc)('attachments', att.id, { public_url: item.signed_url });
                                        item.public_url = item.signed_url;
                                    }
                                    catch (e) {
                                        logger_1.logger.warn('Failed to update attachments.public_url after makePublic', e);
                                    }
                                }
                                catch (e) {
                                    logger_1.logger.warn('Could not create signed URL or makePublic for', gcsPath, e);
                                }
                            }
                        }
                        catch (e) {
                            logger_1.logger.warn('getSignedUrl failed for', att.id, att.storage_path, e);
                        }
                    }
                }
                catch (e) {
                    logger_1.logger.warn('Error preparing attachment signed url', e);
                }
                attachments.push(item);
            }
        }
        catch (e) {
            logger_1.logger.warn('getArticleForEdit: failed to fetch attachments', e);
            attachments = [];
        }
        // workflow events
        let workflow = [];
        try {
            const wfRows = await (0, firestore_helpers_1.executeQuery)('workflow_events', [{ field: 'article_id', op: '==', value: id }]);
            workflow = wfRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        catch (e) {
            logger_1.logger.warn('getArticleForEdit: failed to fetch workflow_events', e);
        }
        // reviews
        let reviews = [];
        try {
            const revRows = await (0, firestore_helpers_1.executeQuery)('reviews', [{ field: 'article_id', op: '==', value: id }]);
            reviews = revRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        catch (e) {
            logger_1.logger.warn('getArticleForEdit: failed to fetch reviews', e);
        }
        // versions
        let versions = [];
        try {
            const verRows = await (0, firestore_helpers_1.executeQuery)('versions', [{ field: 'article_id', op: '==', value: id }]);
            // Note: version.meta.notes unquote logic in SQL, here it's object
            versions = verRows.map((v) => ({
                ...v,
                note: v.meta?.notes || null
            })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        catch (e) {
            logger_1.logger.warn('getArticleForEdit: failed to fetch versions', e);
        }
        res.status(200).json({
            status: 'success',
            data: {
                article,
                attachments,
                workflow,
                reviews,
                versions,
            },
        });
    }
    catch (err) {
        logger_1.logger.error('getArticleForEdit error', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch article', error: err?.message });
    }
};
exports.getArticleForEdit = getArticleForEdit;
const saveDraft = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ status: 'error', message: 'Article id required' });
            return;
        }
        const { content, metaTitle, metaDescription, notes } = req.body || {};
        // Fetch existing metadata to merge
        const article = await (0, firestore_helpers_1.getDoc)('content', id);
        if (!article) {
            res.status(404).json({ status: "error", message: "Article not found" });
            return;
        }
        const existingMeta = article.metadata || {};
        const newMeta = {
            ...existingMeta,
            seo: { title: metaTitle || existingMeta.seo?.title || null, description: metaDescription || existingMeta.seo?.description || null },
            editorNotes: notes || null,
            lastEditedBy: userId,
            lastEditedAt: new Date().toISOString()
        };
        await (0, firestore_helpers_1.updateDoc)('content', id, {
            content: content || article.content, // default to existing if not provided? usually partial update
            metadata: newMeta,
            updated_at: new Date()
        });
        // insert version record
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        const editorId = editorDocs.length > 0 ? editorDocs[0].id : null;
        await (0, firestore_helpers_1.createDoc)('versions', {
            article_id: id,
            editor_id: editorId,
            title: metaTitle || null,
            content: content || null,
            meta: { notes: notes || null },
            created_at: new Date()
        });
        // activity log
        if (editorId) {
            await (0, firestore_helpers_1.createDoc)('editor_activity', {
                editor_id: editorId,
                article_id: id,
                action: 'save_draft',
                action_detail: { metaTitle, metaDescription, notes },
                created_at: new Date()
            });
        }
        res.status(200).json({ status: 'success', message: 'Draft saved' });
    }
    catch (err) {
        logger_1.logger.error('saveDraft error', err);
        res.status(500).json({ status: 'error', message: 'Failed to save draft', error: err?.message });
    }
};
exports.saveDraft = saveDraft;
const finalizeEditing = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ status: 'error', message: 'Article id required' });
            return;
        }
        const { finalContent, finalizeAs } = req.body || {};
        const targetStatus = finalizeAs === 'publish' ? 'approved' : 'under_review';
        await (0, firestore_helpers_1.updateDoc)('content', id, {
            content: finalContent || undefined, // undefined means don't update if null passed? logic was COALESCE
            status: targetStatus,
            updated_at: new Date()
        });
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        const editorId = editorDocs.length > 0 ? editorDocs[0].id : null;
        await (0, firestore_helpers_1.createDoc)('versions', {
            article_id: id,
            editor_id: editorId,
            title: null,
            content: finalContent || null,
            meta: { finalized: true, finalizedBy: userId },
            created_at: new Date()
        });
        await (0, firestore_helpers_1.createDoc)('workflow_events', {
            article_id: id,
            actor_id: userId,
            from_status: 'under_review', // assumed
            to_status: targetStatus,
            note: `Finalized by editor ${userId}`,
            created_at: new Date()
        });
        if (editorId) {
            await (0, firestore_helpers_1.createDoc)('editor_activity', {
                editor_id: editorId,
                article_id: id,
                action: 'finalize',
                action_detail: { targetStatus },
                created_at: new Date()
            });
        }
        // Notify assigning manager
        if (editorId) {
            const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
                { field: 'article_id', op: '==', value: id },
                { field: 'editor_id', op: '==', value: editorId }
            ]);
            if (assignments.length > 0 && assignments[0].assigned_by) {
                const managerId = assignments[0].assigned_by;
                const mUser = await (0, firestore_helpers_1.getDoc)('users', managerId);
                if (mUser && mUser.email) {
                    const activity = finalizeAs === 'publish' ? 'approved' : 'submitted for review';
                    const subject = `Article ${activity}: ${id}`;
                    const body = `
                   <h3>Editor Update</h3>
                   <p>Editor has finalized article <b>${id}</b>.</p>
                   <p>Status: ${targetStatus}</p>
                   <p>Please review it in your dashboard.</p>
                 `;
                    await (0, mailer_1.sendEmail)(mUser.email, subject, body);
                }
                await (0, firestore_helpers_1.createDoc)('notifications', {
                    user_id: managerId,
                    type: 'review_ready',
                    title: 'Article Finalized',
                    message: `Editor pending approval for article ${id}`,
                    link: `/cm-dashboard/submissions/${id}`,
                    created_at: new Date()
                });
                await (0, firestore_helpers_1.createDoc)('communications', {
                    sender_id: userId,
                    receiver_id: managerId,
                    message: `Finalized article editing. Status: ${targetStatus}`,
                    type: 'alert',
                    entity_type: 'article',
                    entity_id: id,
                    created_at: new Date()
                });
            }
        }
        // Mark assignment as completed
        if (editorId) {
            const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
                { field: 'article_id', op: '==', value: id },
                { field: 'editor_id', op: '==', value: editorId }
            ]);
            // Update all matching assignments (should be 1)
            for (const assign of assignments) {
                if (assign.status !== 'cancelled') {
                    await (0, firestore_helpers_1.updateDoc)('editor_assignments', assign.id, {
                        status: 'completed',
                        updated_at: new Date()
                    });
                }
            }
        }
        res.status(200).json({ status: 'success', message: 'Editing finalized', data: { id, status: targetStatus } });
    }
    catch (err) {
        logger_1.logger.error('finalizeEditing error', err);
        res.status(500).json({ status: 'error', message: 'Failed to finalize editing', error: err?.message });
    }
};
exports.finalizeEditing = finalizeEditing;
const requestAuthorChanges = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        const { id } = req.params;
        const { message, severity } = req.body || {};
        if (!id) {
            res.status(400).json({ status: 'error', message: 'Article id required' });
            return;
        }
        const article = await (0, firestore_helpers_1.getDoc)('content', id);
        if (!article) {
            res.status(404).json({ status: 'error', message: 'Article not found' });
            return;
        }
        // update metadata
        const existingMeta = article.metadata || {};
        const newMeta = {
            ...existingMeta,
            lastChangeRequest: {
                by: userId,
                message: message || null,
                severity: severity || null,
                createdAt: new Date().toISOString()
            }
        };
        await (0, firestore_helpers_1.updateDoc)('content', id, {
            status: 'changes_requested',
            metadata: newMeta,
            updated_at: new Date()
        });
        await (0, firestore_helpers_1.createDoc)('workflow_events', {
            article_id: id,
            actor_id: userId,
            from_status: 'under_review',
            to_status: 'changes_requested',
            note: `Request changes (${severity || 'Medium'}): ${message || ''}`,
            created_at: new Date()
        });
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        if (editorDocs.length > 0) {
            await (0, firestore_helpers_1.createDoc)('editor_activity', {
                editor_id: editorDocs[0].id,
                article_id: id,
                action: 'request_changes',
                action_detail: { message, severity },
                created_at: new Date()
            });
        }
        res.status(200).json({ status: 'success', message: 'Change request sent to author' });
    }
    catch (err) {
        logger_1.logger.error('requestAuthorChanges error', err);
        res.status(500).json({ status: 'error', message: 'Failed to request changes', error: err?.message });
    }
};
exports.requestAuthorChanges = requestAuthorChanges;
const approveForPublishing = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ status: 'error', message: 'Article id required' });
            return;
        }
        await (0, firestore_helpers_1.updateDoc)('content', id, {
            status: 'approved',
            updated_at: new Date()
        });
        // Notify assigning manager
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        const editorId = editorDocs.length > 0 ? editorDocs[0].id : null;
        if (editorId) {
            const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
                { field: 'article_id', op: '==', value: id },
                { field: 'editor_id', op: '==', value: editorId }
            ]);
            if (assignments.length > 0 && assignments[0].assigned_by) {
                const managerId = assignments[0].assigned_by;
                const mUser = await (0, firestore_helpers_1.getDoc)('users', managerId);
                if (mUser && mUser.email) {
                    const subject = `Article Approved: ${id}`;
                    const body = `
                   <h3>Editor Approval</h3>
                   <p>Editor has approved article <b>${id}</b> for publishing.</p>
                   <p>It is now ready for final publication.</p>
                 `;
                    await (0, mailer_1.sendEmail)(mUser.email, subject, body);
                }
                await (0, firestore_helpers_1.createDoc)('notifications', {
                    user_id: managerId,
                    type: 'review_ready',
                    title: 'Article Approved',
                    message: `Editor approved article ${id}`,
                    link: `/cm-dashboard/submissions/${id}`,
                    created_at: new Date()
                });
                await (0, firestore_helpers_1.createDoc)('communications', {
                    sender_id: userId,
                    receiver_id: managerId,
                    message: `Approved article for publishing.`,
                    type: 'alert',
                    entity_type: 'article',
                    entity_id: id,
                    created_at: new Date()
                });
            }
        }
        // Mark assignment as completed
        if (editorId) {
            const assignments = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
                { field: 'article_id', op: '==', value: id },
                { field: 'editor_id', op: '==', value: editorId }
            ]);
            for (const assign of assignments) {
                if (assign.status !== 'cancelled') {
                    await (0, firestore_helpers_1.updateDoc)('editor_assignments', assign.id, {
                        status: 'completed',
                        updated_at: new Date()
                    });
                }
            }
        }
        await (0, firestore_helpers_1.createDoc)('workflow_events', {
            article_id: id,
            actor_id: userId,
            from_status: 'under_review',
            to_status: 'approved',
            note: 'Approved by editor',
            created_at: new Date()
        });
        if (editorId) {
            await (0, firestore_helpers_1.createDoc)('editor_activity', {
                editor_id: editorId,
                article_id: id,
                action: 'approve',
                action_detail: { approvedBy: userId },
                created_at: new Date()
            });
        }
        res.status(200).json({ status: 'success', message: 'Article approved for publishing' });
    }
    catch (err) {
        logger_1.logger.error('approveForPublishing error', err);
        res.status(500).json({ status: 'error', message: 'Failed to approve', error: err?.message });
    }
};
exports.approveForPublishing = approveForPublishing;
const getVersions = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const articleId = req.params.id;
        if (!articleId) {
            res.status(400).json({ status: 'error', message: 'Article id required' });
            return;
        }
        const versions = await (0, firestore_helpers_1.executeQuery)('versions', [{ field: 'article_id', op: '==', value: articleId }]);
        // Manual join for editor name
        const results = await Promise.all(versions.map(async (v) => {
            let editorName = 'Unknown Editor';
            if (v.editor_id) {
                const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'id', op: '==', value: v.editor_id }]); // Assuming v.editor_id is the UUID of editor profile
                // Actually in SQL insert we did: (SELECT id FROM editors WHERE user_id = ?). So v.editor_id IS the editor profile ID.
                if (editorDocs.length > 0) {
                    const e = editorDocs[0];
                    if (e.user_id) {
                        const u = await (0, firestore_helpers_1.getDoc)('users', e.user_id);
                        if (u)
                            editorName = u.name || u.email || 'Unknown Editor';
                    }
                }
            }
            return {
                id: v.id,
                article_id: v.article_id,
                editor_id: v.editor_id,
                title: v.title,
                note: v.meta?.notes || null, // in SQL it was JSON_EXTRACT
                created_at: v.created_at, // Firestore timestamp usually
                editor_name: editorName
            };
        }));
        // Sort desc
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        res.status(200).json({ status: 'success', data: results });
    }
    catch (err) {
        logger_1.logger.error('getVersions error', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch versions', error: err?.message });
    }
};
exports.getVersions = getVersions;
const getVersionById = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const versionId = req.params.versionId;
        if (!versionId) {
            res.status(400).json({ status: 'error', message: 'versionId required' });
            return;
        }
        const version = await (0, firestore_helpers_1.getDoc)('versions', versionId);
        if (!version) {
            res.status(404).json({ status: 'error', message: 'Version not found' });
            return;
        }
        res.status(200).json({ status: 'success', data: version });
    }
    catch (err) {
        logger_1.logger.error('getVersionById error', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch version', error: err?.message });
    }
};
exports.getVersionById = getVersionById;
const restoreVersion = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const versionId = req.params.versionId;
        const userId = req.user.userId;
        const { note } = req.body || {};
        if (!versionId) {
            res.status(400).json({ status: 'error', message: 'versionId required' });
            return;
        }
        const version = await (0, firestore_helpers_1.getDoc)('versions', versionId);
        if (!version) {
            res.status(404).json({ status: 'error', message: 'Version not found' });
            return;
        }
        await (0, firestore_helpers_1.updateDoc)('content', version.article_id, {
            content: version.content,
            updated_at: new Date()
        });
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        const editorId = editorDocs.length > 0 ? editorDocs[0].id : null;
        await (0, firestore_helpers_1.createDoc)('versions', {
            article_id: version.article_id,
            editor_id: editorId,
            title: version.title || null,
            content: version.content || null,
            meta: { notes: note || "Restored version " + versionId, restoredBy: userId },
            created_at: new Date(),
            restored_from: version.id
        });
        if (editorId) {
            await (0, firestore_helpers_1.createDoc)('editor_activity', {
                editor_id: editorId,
                article_id: version.article_id,
                action: 'restore_version',
                action_detail: { versionId, note },
                created_at: new Date()
            });
        }
        res.status(200).json({ status: 'success', message: 'Version restored' });
    }
    catch (err) {
        logger_1.logger.error('restoreVersion error', err);
        res.status(500).json({ status: 'error', message: 'Failed to restore version', error: err?.message });
    }
};
exports.restoreVersion = restoreVersion;
// ... existing code ...
const getEditorAnalytics = async (req, res) => {
    // ... existing implementation ...
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        // 1. Get Editor ID
        const editorDocs = await (0, firestore_helpers_1.executeQuery)('editors', [{ field: 'user_id', op: '==', value: userId }]);
        if (editorDocs.length === 0) {
            res.status(404).json({ status: 'error', message: 'Editor not found' });
            return;
        }
        const editorId = editorDocs[0].id;
        // 2. Aggregate Stats
        // Total Edits (completed assignments)
        // Firestore COUNT is not cheap if we read all docs. But for Analytics it's acceptable or we use count aggregation query if SDK supports (admin SDK does).
        // Admin SDK supports .count(). But here we use executeQuery -> getDocs.
        // For now, fetching documents. Optimization: Use Count Queries if performance needed.
        const completed = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
            { field: 'editor_id', op: '==', value: editorId },
            { field: 'status', op: '==', value: 'completed' }
        ]);
        const totalEdits = completed.length;
        // In Progress
        const inProgressAss = await (0, firestore_helpers_1.executeQuery)('editor_assignments', [
            { field: 'editor_id', op: '==', value: editorId },
            { field: 'status', op: '==', value: 'in_progress' }
        ]);
        const inProgress = inProgressAss.length;
        // Versions Created (Revision Cycles roughly)
        // We can't query by editor_id if we didn't index it maybe? We added editor_id to versions in restore logic.
        // Assuming versions has editor_id.
        const versions = await (0, firestore_helpers_1.executeQuery)('versions', [{ field: 'editor_id', op: '==', value: editorId }]);
        const revisionCycles = versions.length;
        // Avg Turnaround (in hours)
        let totalHours = 0;
        let countHours = 0;
        completed.forEach((c) => {
            if (c.created_at && c.updated_at) {
                // Firestore timestamps
                const start = c.created_at.toDate ? c.created_at.toDate() : new Date(c.created_at);
                const end = c.updated_at.toDate ? c.updated_at.toDate() : new Date(c.updated_at);
                const diffMs = end.getTime() - start.getTime();
                const diffHrs = diffMs / (1000 * 60 * 60);
                totalHours += diffHrs;
                countHours++;
            }
        });
        const avgTurnaround = countHours > 0 ? (Math.round((totalHours / countHours) * 10) / 10 + " hours") : "0 hours";
        // 3. Category Breakdown
        // We need article category.
        // fetch all articles for completed assignments? N fetches.
        // Optimization: Group by category derived from article fetch.
        const uniqueArticleIds = [...new Set(completed.map((c) => c.article_id))];
        const categoryStatsMap = {};
        // Parallel fetch articles (batching if needed, but uniqueIds usually small)
        // Limit to 10? No analytics needs all.
        // We will loop.
        for (const artId of uniqueArticleIds) {
            const art = await (0, firestore_helpers_1.getDoc)('content', artId);
            if (art) {
                const cat = art.category_id || 'Uncategorized'; // Assumption: category_id is name logic as before
                // If category_id is ID, we might want map.
                // Let's assume it matches previous logic (string 'General' or ID).
                if (!categoryStatsMap[cat]) {
                    categoryStatsMap[cat] = {
                        count: 0,
                        totalTime: 0,
                        timeCount: 0
                    };
                }
                // Find assignments for this article in 'completed' list
                const assigns = completed.filter((c) => c.article_id === artId);
                assigns.forEach((c) => {
                    categoryStatsMap[cat].count++;
                    if (c.created_at && c.updated_at) {
                        const start = c.created_at.toDate ? c.created_at.toDate() : new Date(c.created_at);
                        const end = c.updated_at.toDate ? c.updated_at.toDate() : new Date(c.updated_at);
                        const diffHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        categoryStatsMap[cat].totalTime += diffHrs;
                        categoryStatsMap[cat].timeCount++;
                    }
                });
            }
        }
        const categoryStats = Object.keys(categoryStatsMap).map(catKey => {
            const stats = categoryStatsMap[catKey];
            const avg = stats.timeCount > 0 ? stats.totalTime / stats.timeCount : 0;
            return {
                category: catKey,
                edits: stats.count,
                avgTime: Math.round(avg * 10) / 10 + " hr",
                qualityScore: 95 + Math.floor(Math.random() * 5) // Mock
            };
        });
        res.status(200).json({
            status: 'success',
            data: {
                overview: {
                    totalEdits,
                    avgTurnaround,
                    revisionCycles,
                    qualityScore: 92, // Mock global quality score
                },
                categoryStats
            }
        });
    }
    catch (err) {
        logger_1.logger.error('getEditorAnalytics error', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch analytics', error: err?.message });
    }
};
exports.getEditorAnalytics = getEditorAnalytics;
/* ==============================
   COMMUNICATIONS
   ============================== */
const getCommunications = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        // Fetch messages where user is sender OR receiver
        // Firestore 'OR' query or 2 queries.
        // executeQuery supports simple AND.
        // We'll do 2 queries and merge.
        const sent = await (0, firestore_helpers_1.executeQuery)('communications', [{ field: 'sender_id', op: '==', value: userId }]);
        const received = await (0, firestore_helpers_1.executeQuery)('communications', [{ field: 'receiver_id', op: '==', value: userId }]);
        const all = [...sent, ...received];
        // Deduplicate by ID if any intersection (unlikely unless self-message)
        const unique = Array.from(new Map(all.map((item) => [item.id, item])).values());
        // Manual join users
        const results = await Promise.all(unique.map(async (c) => {
            let senderName = 'Unknown';
            let receiverName = 'Unknown';
            if (c.sender_id) {
                const s = await (0, firestore_helpers_1.getDoc)('users', c.sender_id);
                if (s)
                    senderName = s.name || s.email || 'Unknown';
            }
            if (c.receiver_id) {
                const r = await (0, firestore_helpers_1.getDoc)('users', c.receiver_id);
                if (r)
                    receiverName = r.name || r.email || 'Unknown';
            }
            return {
                ...c,
                sender_name: senderName,
                receiver_name: receiverName,
                created_at: c.created_at
                // is_read etc
            };
        }));
        // Sort
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        res.status(200).json({ status: 'success', data: results });
    }
    catch (err) {
        logger_1.logger.error('getCommunications error', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch communications' });
    }
};
exports.getCommunications = getCommunications;
const getContentManagers = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        // Fetch users with role 'content_manager' or 'admin' 
        // Firestore 'in' query
        const managers = await (0, firestore_helpers_1.executeQuery)('users', [{ field: 'role', op: 'in', value: ['content_manager', 'admin'] }]);
        // Map to simple structure
        const data = managers.map((m) => ({
            id: m.id,
            name: m.name || m.email, // fallback
            email: m.email,
            role: m.role
        }));
        res.status(200).json({ status: 'success', data });
    }
    catch (err) {
        logger_1.logger.error('getContentManagers error', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch content managers' });
    }
};
exports.getContentManagers = getContentManagers;
const sendMessage = async (req, res) => {
    try {
        if (!requireAuth(req, res))
            return;
        const userId = req.user.userId;
        const { receiverId, subject, message } = req.body;
        if (!receiverId || !message) {
            res.status(400).json({ status: 'error', message: 'Missing receiver or message' });
            return;
        }
        await (0, firestore_helpers_1.createDoc)('communications', {
            sender_id: userId,
            receiver_id: receiverId,
            message: message, // maybe prepend subject?
            // subject field in firestore?
            subject: subject || null,
            type: 'message',
            created_at: new Date(),
            is_read: false
        });
        res.status(200).json({ status: 'success', message: 'Message sent' });
    }
    catch (err) {
        logger_1.logger.error('sendMessage error', err);
        res.status(500).json({ status: 'error', message: 'Failed to send message' });
    }
};
exports.sendMessage = sendMessage;
//# sourceMappingURL=editor.controller.js.map