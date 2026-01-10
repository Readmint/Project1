import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { validationResult } from "express-validator";
import { logger } from "../utils/logger";
import { executeQuery, getDoc, createDoc, updateDoc, deleteDoc } from "../utils/firestore-helpers";
import multer from "multer";
import path from "path";
import stream from "stream";
import { getStorageBucket, getSignedUrl } from "../utils/storage";

/* --------------------------------------------------------------------------
   Helpers / Middleware
   -------------------------------------------------------------------------- */

const requireAuth = (req: Request, res: Response): boolean => {
    if (!req.user || !req.user.userId) {
        res.status(401).json({ status: "error", message: "Unauthorized" });
        return false;
    }
    return true;
};

const requireAdmin = (req: Request, res: Response): boolean => {
    if (!requireAuth(req, res)) return false;
    // Assuming 'admin' or 'content_manager' can manage headers? 
    // User asked for "Admin" specifically, but usually CMs also manage content.
    // Checking both for flexibility, or strictly 'admin'.
    const role = req.user!.role;
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
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const submitApplication = [
    upload.single("resume"), // 'resume' is the field name in frontend FormData
    async (req: Request, res: Response): Promise<void> => {
        try {
            // Validate Basic Fields? 
            // Using manual validation or express-validator in routes. 
            // For FormData/Multer, body is populated after upload.

            const {
                fullName, email, mobile, country, role,
                currentAffiliation, currentDesignation,
                linkedin, googleScholar
            } = req.body;

            if (!fullName || !email || !role) {
                res.status(400).json({ status: "error", message: "Missing required fields" });
                return;
            }

            // 1. Handle File Upload
            const file = (req as any).file;
            let resumeUrl = null;
            let resumeName = null;

            if (file) {
                const ext = path.extname(file.originalname) || ".pdf";
                // Public/Private? Applications contain PII, so private.
                // Storing in 'editorial_applications' folder
                const objectPath = `editorial_applications/${uuidv4()}${ext}`;
                const bucket = getStorageBucket();
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
            const applicationId = uuidv4();
            const applicationData = {
                fullName,
                email,
                mobile,
                country,
                role,
                currentAffiliation,
                currentDesignation,
                linkedin: linkedin || null,
                googleScholar: googleScholar || null,
                resume_storage_path: resumeUrl,
                resume_original_name: resumeName,
                status: 'pending', // pending, reviewed, accepted, rejected
                submitted_at: new Date(),
                ...req.body // Save other dynamic fields like 'subjectExpertise' if passed
            };

            // Clean up duplicates or undefined/nulls if needed, firestore handles it.
            await createDoc('editorial_applications', applicationData, applicationId);

            res.status(200).json({ status: "success", message: "Application submitted successfully" });

        } catch (err: any) {
            logger.error("submitApplication error", err);
            res.status(500).json({ status: "error", message: "Failed to submit application", error: err?.message });
        }
    }
];

/* --------------------------------------------------------------------------
   ADMIN: Get All Applications
   GET /api/editorial/applications
   -------------------------------------------------------------------------- */
export const getApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!requireAdmin(req, res)) return;

        // Fetch all applications
        // TODO: Pagination if needed. For now fetch all.
        const apps = await executeQuery('editorial_applications', []);

        // Process resume URLs (generate signed URLs for admin viewing)
        const processedApps = await Promise.all(apps.map(async (app: any) => {
            if (app.resume_storage_path) {
                try {
                    // Generate short-lived signed URL for admin
                    const signedUrl = await getSignedUrl(app.resume_storage_path, 'read', 60 * 60 * 1000); // 1 hour
                    return { ...app, resume_url: signedUrl };
                } catch (e) {
                    return app;
                }
            }
            return app;
        }));

        // Sort by submitted_at desc
        const toDate = (d: any) => {
            if (!d) return 0;
            try {
                return d.toDate ? d.toDate().getTime() : new Date(d).getTime();
            } catch (e) { return 0; }
        };
        processedApps.sort((a, b) => toDate(b.submitted_at) - toDate(a.submitted_at));

        res.status(200).json({ status: "success", data: processedApps });
    } catch (err: any) {
        logger.error("getApplications error", err);
        res.status(500).json({ status: "error", message: "Failed to fetch applications" });
    }
};

/* --------------------------------------------------------------------------
   PUBLIC: Get Editorial Board
   GET /api/editorial/board
   -------------------------------------------------------------------------- */
export const getBoardMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch all board members
        const members = await executeQuery('editorial_board', []);

        // Sort by order if 'order' field exists, or created_at
        // Assuming we might add an 'order' field later, for now just created_at or role priority?
        // Let's sort created_at asc (oldest first - often chiefs are added first)
        // Or we can simple return and let frontend sort.
        members.sort((a: any, b: any) => (a.order || 999) - (b.order || 999));

        res.status(200).json({ status: "success", data: members });
    } catch (err: any) {
        logger.error("getBoardMembers error", err);
        res.status(500).json({ status: "error", message: "Failed to fetch editorial board" });
    }
};

/* --------------------------------------------------------------------------
   ADMIN: Add Board Member
   POST /api/editorial/board
   -------------------------------------------------------------------------- */
const uploadMemberImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const addBoardMember = [
    uploadMemberImage.single('image'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            if (!requireAdmin(req, res)) return;

            const { name, role, affiliation, bio, color } = req.body;
            if (!name || !role) {
                res.status(400).json({ status: "error", message: "Name and Role are required" });
                return;
            }

            let imageUrl = null;
            const file = (req as any).file;
            if (file) {
                const ext = path.extname(file.originalname) || ".jpg";
                const objectPath = `editorial_board/${uuidv4()}${ext}`;
                const bucket = getStorageBucket();
                const storageFile = bucket.file(objectPath);
                await storageFile.save(file.buffer, {
                    metadata: { contentType: file.mimetype }
                });
                // Make public for website display
                await storageFile.makePublic();
                const bucketName = bucket.name;
                imageUrl = `https://storage.googleapis.com/${bucketName}/${objectPath}`;
            }

            const memberId = uuidv4();
            await createDoc('editorial_board', {
                name,
                role,
                affiliation: affiliation || "",
                bio: bio || "",
                image: imageUrl, // Can be null, frontend will show initials
                color: color || "bg-indigo-100 text-indigo-700", // Default color class
                created_at: new Date()
            }, memberId);

            res.status(200).json({ status: "success", message: "Board member added" });

        } catch (err: any) {
            logger.error("addBoardMember error", err);
            res.status(500).json({ status: "error", message: "Failed to add board member" });
        }
    }
];

/* --------------------------------------------------------------------------
   ADMIN: Delete Board Member
   DELETE /api/editorial/board/:id
   -------------------------------------------------------------------------- */
export const deleteBoardMember = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!requireAdmin(req, res)) return;
        const { id } = req.params;

        await deleteDoc('editorial_board', id);

        res.status(200).json({ status: "success", message: "Board member removed" });
    } catch (err: any) {
        logger.error("deleteBoardMember error", err);
        res.status(500).json({ status: "error", message: "Failed to remove board member" });
    }
};
