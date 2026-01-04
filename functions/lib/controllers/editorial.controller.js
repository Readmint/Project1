"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBoardMember = exports.downloadResume = exports.updateApplicationStatus = exports.addBoardMember = exports.getBoardMembers = exports.getApplications = exports.submitApplication = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const firestore_helpers_1 = require("../utils/firestore-helpers");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage_1 = require("../utils/storage");
const mailer_1 = require("../utils/mailer");
/* --------------------------------------------------------------------------
   Helpers / Middleware
   -------------------------------------------------------------------------- */
const requireAuth = (req, res) => {
    if (!req.user || !req.user.userId) {
        res.status(401).json({ status: "error", message: "Unauthorized" });
        return false;
    }
    return true;
};
const requireAdmin = async (req, res) => {
    if (!requireAuth(req, res))
        return false;
    // Check against DB to ensure role is up-to-date (handles stale tokens)
    try {
        const user = await (0, firestore_helpers_1.getDoc)('users', req.user.userId);
        if (!user) {
            res.status(401).json({ status: "error", message: "User not found" });
            return false;
        }
        const role = user.role;
        if (role !== 'admin' && role !== 'content_manager') {
            res.status(403).json({ status: "error", message: "Forbidden: Admin access required" });
            return false;
        }
        return true;
    }
    catch (e) {
        logger_1.logger.error('Error verifying admin role', e);
        res.status(500).json({ status: "error", message: "Internal Auth Error" });
        return false;
    }
};
/* --------------------------------------------------------------------------
   PUBLIC: Submit Application
   POST /api/editorial/apply
   -------------------------------------------------------------------------- */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
exports.submitApplication = [
    upload.single("resume"), // 'resume' is the field name in frontend FormData
    async (req, res) => {
        try {
            // Validate Basic Fields? 
            // Using manual validation or express-validator in routes. 
            // For FormData/Multer, body is populated after upload.
            const { fullName, email, mobile, country, role, currentAffiliation, currentDesignation, linkedin, googleScholar } = req.body;
            if (!fullName || !email || !role) {
                res.status(400).json({ status: "error", message: "Missing required fields" });
                return;
            }
            // 1. Handle File Upload
            const file = req.file;
            let resumeUrl = null;
            let resumeName = null;
            if (file) {
                const ext = path_1.default.extname(file.originalname) || ".pdf";
                // Public/Private? Applications contain PII, so private.
                // Storing in 'editorial_applications' folder
                const objectPath = `editorial_applications/${(0, uuid_1.v4)()}${ext}`;
                const bucket = (0, storage_1.getStorageBucket)();
                const storageFile = bucket.file(objectPath);
                await storageFile.save(file.buffer, {
                    metadata: {
                        contentType: file.mimetype,
                        metadata: {
                            originalName: file.originalname,
                            applicantEmail: email
                        }
                    }
                });
                // We will store the path or a signed URL that expires? 
                // Better to store path and generate signed URL on view.
                // But for consistency with other parts, if we want to view it easily:
                // Let's store the object path.
                resumeUrl = objectPath;
                resumeName = file.originalname;
            }
            // 2. Save Application to DB
            const applicationId = (0, uuid_1.v4)();
            const applicationData = Object.assign({ fullName,
                email,
                mobile,
                country,
                role,
                currentAffiliation,
                currentDesignation, linkedin: linkedin || null, googleScholar: googleScholar || null, resume_storage_path: resumeUrl, resume_original_name: resumeName, status: 'pending', submitted_at: new Date() }, req.body // Save other dynamic fields like 'subjectExpertise' if passed
            );
            await (0, firestore_helpers_1.createDoc)('editorial_applications', applicationData, applicationId);
            // 3. Send Confirmation Email
            const emailSubject = `Application Received: Editorial Board (${role})`;
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Thank you for applying, ${fullName}!</h2>
                    <p>We have received your application for the position of <strong>${role}</strong> at MindRadiX.</p>
                    <p>Our editorial committee will review your profile, qualifications, and experience. We will get back to you regarding the next steps.</p>
                    <br/>
                    <p><strong>Application Details:</strong></p>
                    <ul>
                        <li><strong>Reference ID:</strong> ${applicationId}</li>
                        <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                    </ul>
                    <br/>
                    <p>Best Regards,<br/><strong>MindRadiX Editorial Team</strong></p>
                </div>
            `;
            // Import sendEmail from '../utils/mailer' needs to be at top, but we can dynamic import or assume it's there. 
            // I will add the import in a separate block if needed, but here I'll assume I can just use it if I add the import.
            // Wait, I need to add the import first. 
            // I will cancel this replacement and do imports first? No, I'll do this block and then add imports at valid location.
            // Actually, I can't add imports with replace_file_content if I'm targeting this block.
            // I'll trust myself to add the import in the next tool call properly.
            await (0, mailer_1.sendEmail)(email, emailSubject, emailHtml);
            res.status(200).json({ status: "success", message: "Application submitted successfully" });
        }
        catch (err) {
            logger_1.logger.error("submitApplication error", err);
            res.status(500).json({ status: "error", message: "Failed to submit application", error: err === null || err === void 0 ? void 0 : err.message });
        }
    }
];
/* --------------------------------------------------------------------------
   ADMIN: Get All Applications
   GET /api/editorial/applications
   -------------------------------------------------------------------------- */
const getApplications = async (req, res) => {
    try {
        if (!requireAdmin(req, res))
            return;
        // Fetch all applications
        // TODO: Pagination if needed. For now fetch all.
        const apps = await (0, firestore_helpers_1.executeQuery)('editorial_applications', []);
        // Process resume URLs (generate signed URLs for admin viewing)
        const processedApps = await Promise.all(apps.map(async (app) => {
            if (app.resume_storage_path) {
                try {
                    // We will now use a Proxy Download endpoint.
                    // Just return the path. Frontend will construct /api/editorial/download-resume?path=...
                    return Object.assign(Object.assign({}, app), { resume_url: null, resume_path: app.resume_storage_path });
                }
                catch (e) {
                    return app;
                }
            }
            return app;
        }));
        // Sort by submitted_at desc
        processedApps.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        res.status(200).json({ status: "success", data: processedApps });
    }
    catch (err) {
        logger_1.logger.error("getApplications error", err);
        res.status(500).json({ status: "error", message: "Failed to fetch applications" });
    }
};
exports.getApplications = getApplications;
/* --------------------------------------------------------------------------
   PUBLIC: Get Editorial Board
   GET /api/editorial/board
   -------------------------------------------------------------------------- */
const getBoardMembers = async (req, res) => {
    try {
        // Fetch all board members
        const members = await (0, firestore_helpers_1.executeQuery)('editorial_board', []);
        // Sort by order if 'order' field exists, or created_at
        // Assuming we might add an 'order' field later, for now just created_at or role priority?
        // Let's sort created_at asc (oldest first - often chiefs are added first)
        // Or we can simple return and let frontend sort.
        members.sort((a, b) => (a.order || 999) - (b.order || 999));
        res.status(200).json({ status: "success", data: members });
    }
    catch (err) {
        logger_1.logger.error("getBoardMembers error", err);
        res.status(500).json({ status: "error", message: "Failed to fetch editorial board" });
    }
};
exports.getBoardMembers = getBoardMembers;
/* --------------------------------------------------------------------------
   ADMIN: Add Board Member
   POST /api/editorial/board
   -------------------------------------------------------------------------- */
const uploadMemberImage = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
exports.addBoardMember = [
    uploadMemberImage.single('image'),
    async (req, res) => {
        try {
            if (!await requireAdmin(req, res))
                return;
            const { name, role, affiliation, bio, color } = req.body;
            if (!name || !role) {
                res.status(400).json({ status: "error", message: "Name and Role are required" });
                return;
            }
            let imageUrl = null;
            const file = req.file;
            if (file) {
                const ext = path_1.default.extname(file.originalname) || ".jpg";
                const objectPath = `editorial_board/${(0, uuid_1.v4)()}${ext}`;
                const bucket = (0, storage_1.getStorageBucket)();
                const storageFile = bucket.file(objectPath);
                await storageFile.save(file.buffer, {
                    metadata: { contentType: file.mimetype }
                });
                // Make public for website display
                await storageFile.makePublic();
                const bucketName = bucket.name;
                imageUrl = `https://storage.googleapis.com/${bucketName}/${objectPath}`;
            }
            const memberId = (0, uuid_1.v4)();
            await (0, firestore_helpers_1.createDoc)('editorial_board', {
                name,
                role,
                affiliation: affiliation || "",
                bio: bio || "",
                image: imageUrl, // Can be null, frontend will show initials
                color: color || "bg-indigo-100 text-indigo-700", // Default color class
                created_at: new Date()
            }, memberId);
            res.status(200).json({ status: "success", message: "Board member added" });
        }
        catch (err) {
            logger_1.logger.error("addBoardMember error", err);
            res.status(500).json({
                status: "error",
                message: "Failed to add board member",
                debug_error: err === null || err === void 0 ? void 0 : err.message,
                debug_stack: err === null || err === void 0 ? void 0 : err.stack
            });
        }
    }
];
/* --------------------------------------------------------------------------
   ADMIN: Update Application Status
   POST /api/editorial/applications/update-status
   -------------------------------------------------------------------------- */
const updateApplicationStatus = async (req, res) => {
    try {
        if (!await requireAdmin(req, res))
            return;
        const { applicationId, status, reason, interviewDate, interviewTime, interviewLink } = req.body;
        // status: 'interview', 'approved', 'rejected'
        if (!applicationId || !status) {
            res.status(400).json({ status: "error", message: "Application ID and Status required" });
            return;
        }
        const appData = await (0, firestore_helpers_1.getDoc)('editorial_applications', applicationId);
        if (!appData) {
            res.status(404).json({ status: "error", message: "Application not found" });
            return;
        }
        const { email, fullName, role } = appData;
        // Perform Update
        await (0, firestore_helpers_1.updateDoc)('editorial_applications', applicationId, {
            status,
            reviewed_at: new Date(),
            rejection_reason: reason || null,
            interview_details: status === 'interview' ? {
                date: interviewDate,
                time: interviewTime,
                link: interviewLink
            } : null
        });
        // Send Email Notification
        let subject = "";
        let htmlBody = "";
        const emailStyles = `font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;`;
        if (status === 'interview') {
            subject = `Invitation for Interview: Editorial Board (${role})`;
            htmlBody = `
                <div style="${emailStyles}">
                    <h3>Dear ${fullName},</h3>
                    <p>We are pleased to inform you that your application for the <strong>${role}</strong> position at MindRadiX has been shortlisted.</p>
                    <p>We would like to invite you for a brief discussion/interview.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Date:</strong> ${interviewDate || 'To be decided'}</p>
                        <p><strong>Time:</strong> ${interviewTime || ''}</p>
                        <p><strong>Link:</strong> <a href="${interviewLink || '#'}">${interviewLink || 'Link will be shared soon'}</a></p>
                    </div>
                    <p>Please confirm your availability by replying to this email.</p>
                    <p>Best Regards,<br/><strong>MindRadiX Editorial Team</strong></p>
                </div>
            `;
        }
        else if (status === 'approved') {
            subject = `Congratulations! Selected for Editorial Board (${role})`;
            htmlBody = `
                <div style="${emailStyles}">
                    <h3>Dear Dr./Mr./Ms. ${fullName},</h3>
                    <p>Congratulations! We are delighted to inform you that you have been selected to join the <strong>MindRadiX Editorial Board</strong> as <strong>${role}</strong>.</p>
                    <p>We were impressed by your profile and expertise. An official appointment letter and certificate will be issued shortly.</p>
                    <p>Welcome to the team!</p>
                    <br/>
                    <p>Best Regards,<br/><strong>MindRadiX Editorial Team</strong></p>
                </div>
            `;
        }
        else if (status === 'rejected') {
            subject = `Update on your Application: Editorial Board (${role})`;
            htmlBody = `
                <div style="${emailStyles}">
                    <h3>Dear ${fullName},</h3>
                    <p>Thank you for giving us the opportunity to review your application for the <strong>${role}</strong> position at MindRadiX.</p>
                    <p>We appreciate the time you took to apply and your interest in our journal. After careful consideration, we have decided to move forward with other candidates who more closely align with our current specific needs.</p>
                    ${reason ? `<div style="background-color: #fff1f2; padding: 15px; border-radius: 8px; border: 1px solid #ffe4e6; color: #9f1239; margin: 10px 0;"><strong>Feedback:</strong> ${reason}</div>` : ''}
                    <p>This does not reflect on your detailed qualifications, and we will keep your profile in our talent pool for future openings.</p>
                    <p>We wish you the very best in your professional endeavors.</p>
                    <br/>
                    <p>Sincerely,<br/><strong>MindRadiX Editorial Team</strong></p>
                </div>
            `;
        }
        if (subject && htmlBody) {
            await (0, mailer_1.sendEmail)(email, subject, htmlBody);
        }
        res.status(200).json({ status: "success", message: `Application ${status}` });
    }
    catch (err) {
        logger_1.logger.error("updateApplicationStatus error", err);
        res.status(500).json({ status: "error", message: "Failed to update status" });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
/* --------------------------------------------------------------------------
   ADMIN: Download Resume (Proxy)
   GET /api/editorial/download-resume
   query: path (storage path)
   -------------------------------------------------------------------------- */
const downloadResume = async (req, res) => {
    try {
        // Authenticate (Admin Only) via Query Token? 
        // Browsers opening links don't send Authorization headers easily unless we use cookies or simple token param.
        // Let's expect '?token=...'
        let token = req.query.token;
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }
        // We can't reuse middleware easily here if it relies strictly on Headers. 
        // Let's do a manual verify for safety OR just assume if they have the valid path + token.
        // For simplicity/speed in this fix, I'll allow it if they have a valid token (any valid user? NO, Admin).
        // Check `functions/src/middleware/auth.ts` verifyToken logic logic duplication?
        // I will trust 'requireAdmin' logic if I can mock the request.. 
        // Actually, let's just use `requireAdmin` but note that for a direct link `<a href...>` we need to append token.
        // Let's Assume the frontend will fetch a blob using axios/fetch with headers, then create object URL. 
        // That is cleaner than query params.
        if (!await requireAdmin(req, res))
            return;
        const storagePath = req.query.path;
        if (!storagePath) {
            res.status(400).json({ status: "error", message: "Path is required" });
            return;
        }
        const bucket = (0, storage_1.getStorageBucket)();
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (!exists) {
            res.status(404).json({ status: "error", message: "File not found" });
            return;
        }
        // Determine Mime Type
        const [metadata] = await file.getMetadata();
        res.setHeader('Content-Type', metadata.contentType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${path_1.default.basename(storagePath)}"`);
        file.createReadStream().pipe(res);
    }
    catch (err) {
        logger_1.logger.error("downloadResume error", err);
        res.status(500).json({ status: "error", message: "Download failed" });
    }
};
exports.downloadResume = downloadResume;
/* --------------------------------------------------------------------------
   ADMIN: Delete Board Member
   DELETE /api/editorial/board/:id
   -------------------------------------------------------------------------- */
const deleteBoardMember = async (req, res) => {
    try {
        if (!await requireAdmin(req, res))
            return;
        const { id } = req.params;
        await (0, firestore_helpers_1.deleteDoc)('editorial_board', id);
        res.status(200).json({ status: "success", message: "Board member removed" });
    }
    catch (err) {
        logger_1.logger.error("deleteBoardMember error", err);
        res.status(500).json({ status: "error", message: "Failed to remove board member" });
    }
};
exports.deleteBoardMember = deleteBoardMember;
//# sourceMappingURL=editorial.controller.js.map