"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBoardMember = exports.addBoardMember = exports.getBoardMembers = exports.getApplications = exports.submitApplication = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const firestore_helpers_1 = require("../utils/firestore-helpers");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage_1 = require("../utils/storage");
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
const requireAdmin = (req, res) => {
    if (!requireAuth(req, res))
        return false;
    // Assuming 'admin' or 'content_manager' can manage headers? 
    // User asked for "Admin" specifically, but usually CMs also manage content.
    // Checking both for flexibility, or strictly 'admin'.
    const role = req.user.role;
    if (role !== 'admin' && role !== 'content_manager') {
        res.status(403).json({ status: "error", message: "Forbidden: Admin access required" });
        return false;
    }
    return true;
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
            // Clean up duplicates or undefined/nulls if needed, firestore handles it.
            await (0, firestore_helpers_1.createDoc)('editorial_applications', applicationData, applicationId);
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
                    // Generate short-lived signed URL for admin
                    const signedUrl = await (0, storage_1.getSignedUrl)(app.resume_storage_path, 'read', 60 * 60 * 1000); // 1 hour
                    return Object.assign(Object.assign({}, app), { resume_url: signedUrl });
                }
                catch (e) {
                    return app;
                }
            }
            return app;
        }));
        // Sort by submitted_at desc
        const toDate = (d) => {
            if (!d)
                return 0;
            try {
                return d.toDate ? d.toDate().getTime() : new Date(d).getTime();
            }
            catch (e) {
                return 0;
            }
        };
        processedApps.sort((a, b) => toDate(b.submitted_at) - toDate(a.submitted_at));
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
            if (!requireAdmin(req, res))
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
            res.status(500).json({ status: "error", message: "Failed to add board member" });
        }
    }
];
/* --------------------------------------------------------------------------
   ADMIN: Delete Board Member
   DELETE /api/editorial/board/:id
   -------------------------------------------------------------------------- */
const deleteBoardMember = async (req, res) => {
    try {
        if (!requireAdmin(req, res))
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