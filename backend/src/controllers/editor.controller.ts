// src/controllers/editor.controller.ts
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { validationResult } from "express-validator";
import { getDatabase } from "../config/database";
import { logger } from "../utils/logger";
import multer from "multer";
import path from "path";
import stream from "stream";
import { getStorageBucket, getSignedUrl, makeFilePublic } from "../utils/storage";
import { sendEmail } from "../utils/mailer";

declare global {
  namespace Express {
    interface Request {
      user?: { userId?: string; role?: string; email?: string };
    }
  }
}

/**
 * Auth guard
 */
const requireAuth = (req: Request, res: Response): boolean => {
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

export const getEditorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;

    // attempt to fetch editor row joined with users.email
    const [rows]: any = await db.execute(
      `SELECT e.*, u.email as email
       FROM editors e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.user_id = ? LIMIT 1`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      // if no editor row, try to fetch user's email from users table
      const [userRows]: any = await db.execute(`SELECT email FROM users WHERE id = ? LIMIT 1`, [userId]);
      const userEmail = userRows && userRows[0] ? userRows[0].email : null;

      // return minimal profile structure
      res.status(200).json({
        status: "success",
        data: {
          user_id: userId,
          email: userEmail || null,
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

    const profile = rows[0];
    try {
      if (typeof profile.fields === "string") profile.fields = JSON.parse(profile.fields || "[]");
    } catch (e) {
      profile.fields = profile.fields || [];
    }

    res.status(200).json({ status: "success", data: profile });
  } catch (err: any) {
    logger.error("getEditorProfile error", err);
    res.status(500).json({ status: "error", message: "Failed to fetch profile", error: err?.message });
  }
};

export const saveEditorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: "error", message: "Validation failed", errors: errors.array() });
      return;
    }

    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const {
      display_name,
      profile_photo_url,
      fields,
      experience_months,
      is_active,
      resume_url,
      resume_name,
      email, // accept email and update users table if provided
      languages, // [NEW] Accept languages array
    } = req.body || {};

    // try update first
    const [updateResult]: any = await db.execute(
      `UPDATE editors SET
         display_name = COALESCE(?, display_name),
         profile_photo_url = COALESCE(?, profile_photo_url),
         fields = COALESCE(?, fields),
         experience_months = COALESCE(?, experience_months),
         is_active = COALESCE(?, is_active),
         resume_url = COALESCE(?, resume_url),
         resume_name = COALESCE(?, resume_name),
         updated_at = NOW()
       WHERE user_id = ?`,
      [
        display_name || null,
        profile_photo_url || null,
        fields ? JSON.stringify(fields) : (languages ? JSON.stringify({ languages }) : null), // If fields provided use it, else if languages provided wrap it
        typeof experience_months === "number" ? experience_months : null,
        typeof is_active === "boolean" ? is_active : null,
        resume_url || null,
        resume_name || null,
        userId,
      ]
    );

    // if no rows updated -> insert
    if (!updateResult || (updateResult && updateResult.affectedRows === 0)) {
      // NOTE: columns list: id, user_id, display_name, profile_photo_url, fields, experience_months, is_active, resume_url, resume_name, created_at, updated_at
      // we provide 8 placeholders after UUID() to match the params array below
      await db.execute(
        `INSERT INTO editors (id, user_id, display_name, profile_photo_url, fields, experience_months, is_active, resume_url, resume_name, created_at, updated_at)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          display_name || null,
          profile_photo_url || null,
          fields ? JSON.stringify(fields) : (languages ? JSON.stringify({ languages }) : JSON.stringify([])),
          typeof experience_months === "number" ? experience_months : 0,
          typeof is_active === "boolean" ? is_active : true,
          resume_url || null,
          resume_name || null,
        ]
      );
    }

    // if email provided, attempt to update users.email as well
    if (typeof email !== "undefined" && email !== null && String(email).trim() !== "") {
      try {
        await db.execute(`UPDATE users SET email = ? WHERE id = ?`, [String(email).trim(), userId]);
      } catch (e) {
        // don't fail the whole request if updating email fails; log and continue
        logger.warn("saveEditorProfile: failed to update users.email", e);
      }
    }

    // fetch and return saved row (join users.email)
    const [rows]: any = await db.execute(
      `SELECT e.*, u.email as email FROM editors e LEFT JOIN users u ON u.id = e.user_id WHERE e.user_id = ? LIMIT 1`,
      [userId]
    );
    const saved = rows && rows[0] ? rows[0] : null;
    if (saved && typeof saved.fields === "string") {
      try { saved.fields = JSON.parse(saved.fields || "[]"); } catch { saved.fields = []; }
    }

    // log activity
    await db.execute(
      `INSERT INTO editor_activity (id, editor_id, action, action_detail, created_at)
       VALUES (UUID(), (SELECT id FROM editors WHERE user_id = ? LIMIT 1), 'profile_update', ?, NOW())`,
      [userId, JSON.stringify({ updatedBy: userId })]
    );

    res.status(200).json({ status: "success", message: "Profile saved", data: saved });
  } catch (err: any) {
    logger.error("saveEditorProfile error", err);
    res.status(500).json({ status: "error", message: "Failed to save profile", error: err?.message });
  }
};

/* ==========================
   RESUME UPLOAD (uses src/utils/storage.ts)
   ========================== */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

export const uploadEditorResume = [
  upload.single("resume"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!requireAuth(req, res)) return;
      const db: any = getDatabase();
      const userId = req.user!.userId!;

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ status: "error", message: "No resume uploaded" });
        return;
      }

      // Validate type (optional)
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowed.includes(file.mimetype)) {
        // If you want to reject non-supported types, uncomment:
        // return res.status(400).json({ status: 'error', message: 'Unsupported file type' });
        logger.warn(`uploadEditorResume: unexpected mimetype ${file.mimetype} from user ${userId}`);
      }

      // storage path inside bucket
      const ext = path.extname(file.originalname) || ".pdf";
      const objectPath = `editors/${userId}/resumes/resume_${uuidv4()}${ext}`;

      // upload buffer using the bucket returned by getStorageBucket()
      const bucket = getStorageBucket();
      const storageFile = bucket.file(objectPath);
      const passthrough = new stream.PassThrough();
      passthrough.end(file.buffer);

      await new Promise<void>((resolve, reject) => {
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
          .on("error", (err: any) => reject(err));
      });

      // generate signed URL (long-lived). getSignedUrl helper expects path & expiryMs
      const hundredYearsMs = 100 * 365 * 24 * 60 * 60 * 1000;
      const signedUrl = await getSignedUrl(objectPath, "read", hundredYearsMs);

      // Save resume_url and resume_name in DB (resume_url will be the signed URL)
      await db.execute(
        `UPDATE editors SET resume_url = ?, resume_name = ?, updated_at = NOW() WHERE user_id = ?`,
        [signedUrl, file.originalname, userId]
      );

      // fetch saved row to return
      const [rows]: any = await db.execute("SELECT * FROM editors WHERE user_id = ? LIMIT 1", [userId]);
      const saved = rows && rows[0] ? rows[0] : null;
      if (saved && typeof saved.fields === "string") {
        try { saved.fields = JSON.parse(saved.fields || "[]"); } catch { saved.fields = []; }
      }

      // log activity
      await db.execute(
        `INSERT INTO editor_activity (id, editor_id, action, action_detail, created_at)
         VALUES (UUID(), (SELECT id FROM editors WHERE user_id = ? LIMIT 1), 'upload_resume', ?, NOW())`,
        [userId, JSON.stringify({ uploadedBy: userId, object: objectPath })]
      );

      res.status(200).json({
        status: "success",
        message: "Resume uploaded",
        data: { resume_url: signedUrl, resume_name: file.originalname, profile: saved },
      });
    } catch (err: any) {
      logger.error("uploadEditorResume error", err);
      res.status(500).json({ status: "error", message: "Failed to upload resume", error: err?.message });
    }
  },
];

/* ==========================================
   ASSIGNMENTS / LISTING / GET ARTICLE FOR EDIT
   (the rest of your original controller methods)
   ========================================== */

export const getAssignedForEditor = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;

    // resolve editor.id
    const [edRows]: any = await db.execute('SELECT id FROM editors WHERE user_id = ? LIMIT 1', [userId]);
    if (!edRows || edRows.length === 0) {
      res.status(200).json({ status: 'success', data: [] });
      return;
    }
    const editorId = edRows[0].id;

    const [rows]: any = await db.execute(
      `SELECT ea.id as assignment_id, ea.article_id, c.title, c.status, ea.assigned_date, ea.due_date, ea.priority, ea.status AS assignment_status,
              COALESCE(NULLIF(a.display_name, ''), NULLIF(u.name, ''), u.email, 'Unknown Author') as author_name
       FROM editor_assignments ea
       LEFT JOIN content c ON c.id = ea.article_id
       LEFT JOIN users u ON u.id = c.author_id
       LEFT JOIN authors a ON a.user_id = c.author_id
       WHERE ea.editor_id = ? AND ea.status IN ('assigned', 'in_progress')
       ORDER BY ea.assigned_date DESC`,
      [editorId]
    );

    res.status(200).json({ status: 'success', data: rows || [] });
  } catch (err: any) {
    logger.error('getAssignedForEditor error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch assignments', error: err?.message });
  }
}


export const getSubmittedForEditor = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;

    // resolve editor.id
    const [edRows]: any = await db.execute('SELECT id FROM editors WHERE user_id = ? LIMIT 1', [userId]);
    if (!edRows || edRows.length === 0) {
      res.status(200).json({ status: 'success', data: [] });
      return;
    }
    const editorId = edRows[0].id;

    // Fetch articles where assignment status is completed
    const [rows]: any = await db.execute(
      `SELECT ea.id as assignment_id, ea.article_id, c.title, c.status as article_status, ea.assigned_date, ea.due_date, ea.priority, ea.status AS assignment_status, ea.updated_at as completed_at, cat.name as category,
              COALESCE(NULLIF(a.display_name, ''), NULLIF(u.name, ''), u.email, 'Unknown Author') as author_name
       FROM editor_assignments ea
       LEFT JOIN content c ON c.id = ea.article_id
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       LEFT JOIN users u ON u.id = c.author_id
       LEFT JOIN authors a ON a.user_id = c.author_id
       WHERE ea.editor_id = ? AND ea.status = 'completed'
       ORDER BY ea.updated_at DESC`,
      [editorId]
    );

    res.status(200).json({ status: 'success', data: rows || [] });
  } catch (err: any) {
    logger.error('getSubmittedForEditor error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch submitted articles', error: err?.message });
  }
}

/**
 * Helper to normalize potential forms returned by getSignedUrl helper
 */
function normalizeSignedUrl(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0];
  if (typeof val === 'object' && val !== null) {
    if (typeof val.url === 'string') return val.url;
    if (typeof val.publicUrl === 'string') return val.publicUrl;
    if (typeof val.public_url === 'string') return val.public_url;
  }
  return null;
}

/**
 * GET article for editor -> returns article + attachments (with signed read URLs when possible) + workflow events + reviews + versions
 */
export const getArticleForEdit = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'error', message: 'Article id required' });
      return;
    }

    const [rows]: any = await db.execute(
      `SELECT c.*, u.email as author_email, COALESCE(NULLIF(a.display_name, ''), NULLIF(u.name, ''), u.email, 'Unknown Author') as author_name
       FROM content c
       LEFT JOIN users u ON u.id = c.author_id
       LEFT JOIN authors a ON a.user_id = c.author_id
       WHERE c.id = ? LIMIT 1`,
      [id]
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    const article = rows[0];

    // Fallback: If author_name is missing/empty, try fetching purely from users table
    // This handles cases where the JOIN might have behaved unexpectedly or data is partial
    if (!article.author_name || article.author_name === 'Unknown Author') {
      try {
        const [uRows]: any = await db.execute('SELECT name, email FROM users WHERE id = ?', [article.author_id]);
        if (uRows && uRows.length > 0) {
          const u = uRows[0];
          article.author_name = u.name || u.email || 'Unknown Author';
          article.author_email = u.email;
          console.log(`[DEBUG] Recovered author name via direct query: ${article.author_name}`);
        }
      } catch (err) {
        console.error('Failed to recover author name', err);
      }
    }

    console.log(`[DEBUG] getArticleForEdit id=${id} author_id=${article.author_id} author_email=${article.author_email} author_name=${article.author_name}`);

    // permission: ensure editor assigned, or privileged roles
    const privileged = ['admin', 'content_manager'];
    const callerRole = req.user!.role || '';
    if (!privileged.includes(callerRole)) {
      // check assignment
      const [assignRows]: any = await db.execute(
        'SELECT id FROM editor_assignments WHERE article_id = ? AND editor_id = (SELECT id FROM editors WHERE user_id = ? LIMIT 1) LIMIT 1',
        [id, userId]
      );
      if (!assignRows || assignRows.length === 0) {
        res.status(403).json({ status: 'error', message: 'Forbidden: not assigned' });
        return;
      }
    }

    // parse metadata safely
    try {
      if (typeof article.metadata === 'string') article.metadata = JSON.parse(article.metadata || '{}');
    } catch (e) {
      article.metadata = article.metadata || {};
    }

    // Fetch attachments for this article and attempt to attach signed URLs (read) for the editor
    let attachments: any[] = [];
    try {
      const [attRows]: any = await db.execute(
        'SELECT id, filename, public_url, storage_path, mime_type, size_bytes, uploaded_by, uploaded_at FROM attachments WHERE article_id = ? ORDER BY uploaded_at ASC',
        [id]
      );
      const bucket = getStorageBucket();
      for (const att of (attRows || [])) {
        const item: any = { id: att.id, filename: att.filename, mime_type: att.mime_type, size_bytes: att.size_bytes, uploaded_by: att.uploaded_by, uploaded_at: att.uploaded_at, public_url: att.public_url || null, signed_url: null, storage_path: att.storage_path || null };
        try {
          if (att.public_url) {
            item.signed_url = att.public_url;
          } else if (att.storage_path) {
            const gcsPath = att.storage_path.startsWith('gcs/') ? att.storage_path.slice(4) : att.storage_path;
            // try to generate signed read url
            try {
              const readSigned = await getSignedUrl(gcsPath, 'read', 7 * 24 * 60 * 60 * 1000); // 7 days
              const normalized = normalizeSignedUrl(readSigned);
              if (normalized) {
                item.signed_url = normalized;
              } else {
                // fallback: attempt to make public (best-effort)
                try {
                  await bucket.file(gcsPath).makePublic();
                  const bucketName = (bucket as any).name || process.env.FIREBASE_STORAGE_BUCKET;
                  item.signed_url = `https://storage.googleapis.com/${bucketName}/${encodeURI(gcsPath)}`;
                  // update DB with public_url best-effort
                  try {
                    await db.execute('UPDATE attachments SET public_url = ? WHERE id = ?', [item.signed_url, att.id]);
                    item.public_url = item.signed_url;
                  } catch (e) {
                    logger.warn('Failed to update attachments.public_url after makePublic', e);
                  }
                } catch (e) {
                  // leave signed_url null but proceed
                  logger.warn('Could not create signed URL or makePublic for', gcsPath, e);
                }
              }
            } catch (e) {
              logger.warn('getSignedUrl failed for', att.id, att.storage_path, e);
            }
          }
        } catch (e) {
          logger.warn('Error preparing attachment signed url', e);
        }
        attachments.push(item);
      }
    } catch (e) {
      logger.warn('getArticleForEdit: failed to fetch attachments', e);
      attachments = [];
    }

    // workflow events
    let workflow: any[] = [];
    try {
      const [wfRows]: any = await db.execute('SELECT id, actor_id, from_status, to_status, note, created_at FROM workflow_events WHERE article_id = ? ORDER BY created_at DESC', [id]);
      workflow = wfRows || [];
    } catch (e) {
      logger.warn('getArticleForEdit: failed to fetch workflow_events', e);
    }

    // reviews
    let reviews: any[] = [];
    try {
      const [revRows]: any = await db.execute('SELECT id, reviewer_id, summary, details, decision, similarity_score, created_at FROM reviews WHERE article_id = ? ORDER BY created_at DESC', [id]);
      reviews = revRows || [];
    } catch (e) {
      logger.warn('getArticleForEdit: failed to fetch reviews', e);
    }

    // versions
    let versions: any[] = [];
    try {
      const [verRows]: any = await db.execute('SELECT id, article_id, editor_id, title, JSON_UNQUOTE(JSON_EXTRACT(meta, "$.notes")) as note, created_at, restored_from FROM versions WHERE article_id = ? ORDER BY created_at DESC', [id]);
      versions = verRows || [];
    } catch (e) {
      logger.warn('getArticleForEdit: failed to fetch versions', e);
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
  } catch (err: any) {
    logger.error('getArticleForEdit error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch article', error: err?.message });
  }
};

export const saveDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'error', message: 'Article id required' });
      return;
    }
    const { content, metaTitle, metaDescription, notes } = req.body || {};

    await db.execute(
      `UPDATE content SET content = COALESCE(?, content), metadata = JSON_MERGE_PATCH(IFNULL(metadata, JSON_OBJECT()), ?), updated_at = NOW() WHERE id = ?`,
      [
        content || null,
        JSON.stringify({
          seo: { title: metaTitle || null, description: metaDescription || null },
          editorNotes: notes || null,
          lastEditedBy: userId,
          lastEditedAt: new Date().toISOString()
        }),
        id,
      ]
    );

    // insert version record
    await db.execute(
      `INSERT INTO versions (id, article_id, editor_id, title, content, meta, created_at)
       VALUES (UUID(), ?, (SELECT id FROM editors WHERE user_id = ? LIMIT 1), ?, ?, ?)`,
      [id, userId, metaTitle || null, content || null, JSON.stringify({ notes: notes || null })]
    );

    // activity log
    await db.execute(
      `INSERT INTO editor_activity (id, editor_id, article_id, action, action_detail, created_at)
       VALUES (UUID(), (SELECT id FROM editors WHERE user_id = ? LIMIT 1), ?, 'save_draft', ?, NOW())`,
      [userId, id, JSON.stringify({ metaTitle, metaDescription, notes })]
    );

    res.status(200).json({ status: 'success', message: 'Draft saved' });
  } catch (err: any) {
    logger.error('saveDraft error', err);
    res.status(500).json({ status: 'error', message: 'Failed to save draft', error: err?.message });
  }
};

export const finalizeEditing = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'error', message: 'Article id required' });
      return;
    }
    const { finalContent, finalizeAs } = req.body || {};
    const targetStatus = finalizeAs === 'publish' ? 'approved' : 'under_review';

    await db.execute(`UPDATE content SET content = COALESCE(?, content), status = ?, updated_at = NOW() WHERE id = ?`, [finalContent || null, targetStatus, id]);

    await db.execute(
      `INSERT INTO versions (id, article_id, editor_id, title, content, meta, created_at)
       VALUES (UUID(), ?, (SELECT id FROM editors WHERE user_id = ? LIMIT 1), NULL, ?, ?, NOW())`,
      [id, userId, finalContent || null, JSON.stringify({ finalized: true, finalizedBy: userId })]
    );

    await db.execute(
      `INSERT INTO workflow_events (id, article_id, actor_id, from_status, to_status, note, created_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
      [id, userId, 'under_review', targetStatus, `Finalized by editor ${userId}`]
    );

    await db.execute(
      `INSERT INTO editor_activity (id, editor_id, article_id, action, action_detail, created_at)
       VALUES (UUID(), (SELECT id FROM editors WHERE user_id = ? LIMIT 1), ?, 'finalize', ?, NOW())`,
      [userId, id, JSON.stringify({ targetStatus })]
    );

    // Notify assigning manager
    const [assignRows]: any = await db.execute(
      'SELECT assigned_by FROM editor_assignments WHERE article_id = ? AND editor_id = (SELECT id FROM editors WHERE user_id = ?) LIMIT 1',
      [id, userId]
    );

    if (assignRows.length > 0 && assignRows[0].assigned_by) {
      const managerId = assignRows[0].assigned_by;

      // Get manager email
      const [mUsers]: any = await db.execute('SELECT email FROM users WHERE id = ?', [managerId]);
      if (mUsers.length > 0) {
        const activity = finalizeAs === 'publish' ? 'approved' : 'submitted for review';
        const subject = `Article ${activity}: ${id}`;
        const body = `
           <h3>Editor Update</h3>
           <p>Editor has finalized article <b>${id}</b>.</p>
           <p>Status: ${targetStatus}</p>
           <p>Please review it in your dashboard.</p>
         `;
        await sendEmail(mUsers[0].email, subject, body);
      }

      await db.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
         VALUES (UUID(), ?, 'review_ready', 'Article Finalized', ?, ?, NOW())`,
        [managerId, `Editor pending approval for article ${id}`, `/cm-dashboard/submissions/${id}`]
      );

      await db.execute(
        `INSERT INTO communications (id, sender_id, receiver_id, message, type, entity_type, entity_id, created_at)
         VALUES (UUID(), ?, ?, ?, 'alert', 'article', ?, NOW())`,
        [userId, managerId, `Finalized article editing. Status: ${targetStatus}`, id]
      );
    }

    // Mark assignment as completed
    await db.execute(
      `UPDATE editor_assignments SET status = 'completed', updated_at = NOW() 
       WHERE article_id = ? AND editor_id = (SELECT id FROM editors WHERE user_id = ?) AND status != 'cancelled'`,
      [id, userId]
    );

    res.status(200).json({ status: 'success', message: 'Editing finalized', data: { id, status: targetStatus } });
  } catch (err: any) {
    logger.error('finalizeEditing error', err);
    res.status(500).json({ status: 'error', message: 'Failed to finalize editing', error: err?.message });
  }
};

export const requestAuthorChanges = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { id } = req.params;
    const { message, severity } = req.body || {};

    if (!id) {
      res.status(400).json({ status: 'error', message: 'Article id required' });
      return;
    }

    await db.execute(
      `UPDATE content SET status = 'changes_requested', metadata = JSON_MERGE_PATCH(IFNULL(metadata, JSON_OBJECT()), ?), updated_at = NOW() WHERE id = ?`,
      [JSON.stringify({ lastChangeRequest: { by: userId, message: message || null, severity: severity || null, createdAt: new Date().toISOString() } }), id]
    );

    await db.execute(
      `INSERT INTO workflow_events (id, article_id, actor_id, from_status, to_status, note, created_at)
       VALUES (UUID(), ?, ?, ?, 'changes_requested', ?, NOW())`,
      [id, userId, 'under_review', `Request changes (${severity || 'Medium'}): ${message || ''}`]
    );

    await db.execute(
      `INSERT INTO editor_activity (id, editor_id, article_id, action, action_detail, created_at)
       VALUES (UUID(), (SELECT id FROM editors WHERE user_id = ? LIMIT 1), ?, 'request_changes', ?, NOW())`,
      [userId, id, JSON.stringify({ message, severity })]
    );

    res.status(200).json({ status: 'success', message: 'Change request sent to author' });
  } catch (err: any) {
    logger.error('requestAuthorChanges error', err);
    res.status(500).json({ status: 'error', message: 'Failed to request changes', error: err?.message });
  }
};

export const approveForPublishing = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'error', message: 'Article id required' });
      return;
    }

    await db.execute(`UPDATE content SET status = 'approved', updated_at = NOW() WHERE id = ?`, [id]);

    // Notify assigning manager
    const [assignRows]: any = await db.execute(
      'SELECT assigned_by FROM editor_assignments WHERE article_id = ? AND editor_id = (SELECT id FROM editors WHERE user_id = ?) LIMIT 1',
      [id, userId]
    );

    if (assignRows.length > 0 && assignRows[0].assigned_by) {
      const managerId = assignRows[0].assigned_by;

      // Get manager email
      const [mUsers]: any = await db.execute('SELECT email FROM users WHERE id = ?', [managerId]);
      if (mUsers.length > 0) {
        const subject = `Article Approved: ${id}`;
        const body = `
           <h3>Editor Approval</h3>
           <p>Editor has approved article <b>${id}</b> for publishing.</p>
           <p>It is now ready for final publication.</p>
         `;
        await sendEmail(mUsers[0].email, subject, body);
      }

      await db.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, link, created_at)
         VALUES (UUID(), ?, 'review_ready', 'Article Approved', ?, ?, NOW())`,
        [managerId, `Editor approved article ${id}`, `/cm-dashboard/submissions/${id}`]
      );

      await db.execute(
        `INSERT INTO communications (id, sender_id, receiver_id, message, type, entity_type, entity_id, created_at)
         VALUES (UUID(), ?, ?, ?, 'alert', 'article', ?, NOW())`,
        [userId, managerId, `Approved article for publishing.`, id]
      );
    }

    // Mark assignment as completed
    await db.execute(
      `UPDATE editor_assignments SET status = 'completed', updated_at = NOW() 
       WHERE article_id = ? AND editor_id = (SELECT id FROM editors WHERE user_id = ?) AND status != 'cancelled'`,
      [id, userId]
    );

    await db.execute(
      `INSERT INTO workflow_events (id, article_id, actor_id, from_status, to_status, note, created_at)
       VALUES (UUID(), ?, ?, ?, 'approved', ?, NOW())`,
      [id, userId, 'under_review', 'Approved by editor']
    );

    await db.execute(
      `INSERT INTO editor_activity (id, editor_id, article_id, action, action_detail, created_at)
       VALUES (UUID(), (SELECT id FROM editors WHERE user_id = ? LIMIT 1), ?, 'approve', ?, NOW())`,
      [userId, id, JSON.stringify({ approvedBy: userId })]
    );

    res.status(200).json({ status: 'success', message: 'Article approved for publishing' });
  } catch (err: any) {
    logger.error('approveForPublishing error', err);
    res.status(500).json({ status: 'error', message: 'Failed to approve', error: err?.message });
  }
};

export const getVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const articleId = req.params.id;
    if (!articleId) {
      res.status(400).json({ status: 'error', message: 'Article id required' });
      return;
    }

    const [rows]: any = await db.execute(
      `SELECT v.id, v.article_id, v.editor_id, v.title, JSON_UNQUOTE(JSON_EXTRACT(v.meta,'$.notes')) as note, v.created_at, u.name as editor_name
       FROM versions v
       LEFT JOIN editors e ON v.editor_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE v.article_id = ? 
       ORDER BY v.created_at DESC`,
      [articleId]
    );

    res.status(200).json({ status: 'success', data: rows || [] });
  } catch (err: any) {
    logger.error('getVersions error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch versions', error: err?.message });
  }
};

export const getVersionById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const versionId = req.params.versionId;
    if (!versionId) {
      res.status(400).json({ status: 'error', message: 'versionId required' });
      return;
    }

    const [rows]: any = await db.execute('SELECT * FROM versions WHERE id = ? LIMIT 1', [versionId]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Version not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: rows[0] });
  } catch (err: any) {
    logger.error('getVersionById error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch version', error: err?.message });
  }
};

export const restoreVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const versionId = req.params.versionId;
    const userId = req.user!.userId!;
    const { note } = req.body || {};

    if (!versionId) {
      res.status(400).json({ status: 'error', message: 'versionId required' });
      return;
    }

    const [rows]: any = await db.execute('SELECT * FROM versions WHERE id = ? LIMIT 1', [versionId]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Version not found' });
      return;
    }
    const version = rows[0];

    await db.execute('UPDATE content SET content = ?, updated_at = NOW() WHERE id = ?', [version.content, version.article_id]);

    await db.execute(
      `INSERT INTO versions (id, article_id, editor_id, title, content, meta, created_at, restored_from)
       VALUES (UUID(), ?, (SELECT id FROM editors WHERE user_id = ? LIMIT 1), ?, ?, ?, NOW(), ?)`,
      [version.article_id, userId, version.title || null, version.content || null, JSON.stringify({ notes: note || "Restored version " + versionId, restoredBy: userId }), version.id]
    );

    await db.execute(
      `INSERT INTO editor_activity (id, editor_id, article_id, action, action_detail, created_at)
       VALUES (UUID(), (SELECT id FROM editors WHERE user_id = ? LIMIT 1), ?, 'restore_version', ?, NOW())`,
      [userId, version.article_id, JSON.stringify({ versionId, note })]
    );

    res.status(200).json({ status: 'success', message: 'Version restored' });
  } catch (err: any) {
    logger.error('restoreVersion error', err);
    res.status(500).json({ status: 'error', message: 'Failed to restore version', error: err?.message });
  }
};

// ... existing code ...

export const getEditorAnalytics = async (req: Request, res: Response): Promise<void> => {
  // ... existing implementation ...
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;

    // 1. Get Editor ID
    const [editorRows]: any = await db.execute('SELECT id FROM editors WHERE user_id = ? LIMIT 1', [userId]);
    if (!editorRows || editorRows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Editor not found' });
      return;
    }
    const editorId = editorRows[0].id;

    // 2. Aggregate Stats
    // Total Edits (completed assignments)
    const [totalEditsRes]: any = await db.execute(
      `SELECT COUNT(*) as count FROM editor_assignments WHERE editor_id = ? AND status = 'completed'`,
      [editorId]
    );
    const totalEdits = totalEditsRes[0].count;

    // In Progress
    const [inProgressRes]: any = await db.execute(
      `SELECT COUNT(*) as count FROM editor_assignments WHERE editor_id = ? AND status = 'in_progress'`,
      [editorId]
    );
    const inProgress = inProgressRes[0].count;

    // Versions Created (Revision Cycles roughly)
    const [versionsRes]: any = await db.execute(
      `SELECT COUNT(*) as count FROM versions WHERE editor_id = ?`,
      [editorId]
    );
    const revisionCycles = versionsRes[0].count;

    // Avg Turnaround (in hours) - simplified: avg diff between assigned created_at and updated_at for completed
    const [timeRes]: any = await db.execute(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours
       FROM editor_assignments 
       WHERE editor_id = ? AND status = 'completed'`,
      [editorId]
    );
    const avgTurnaround = timeRes[0].avg_hours ? Math.round(timeRes[0].avg_hours * 10) / 10 + " hours" : "0 hours";

    // 3. Category Breakdown
    const [categoryRows]: any = await db.execute(
      `SELECT cat.name as category, COUNT(ea.id) as edits, 
              AVG(TIMESTAMPDIFF(HOUR, ea.created_at, ea.updated_at)) as avg_time
       FROM editor_assignments ea
       JOIN content c ON ea.article_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE ea.editor_id = ? AND ea.status = 'completed'
       GROUP BY cat.name`,
      [editorId]
    );

    const categoryStats = categoryRows.map((r: any) => ({
      category: r.category || 'Uncategorized',
      edits: r.edits,
      avgTime: r.avg_time ? Math.round(r.avg_time * 10) / 10 + " hr" : "0 hr",
      qualityScore: 95 + Math.floor(Math.random() * 5) // Mock quality score for now high
    }));

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

  } catch (err: any) {
    logger.error('getEditorAnalytics error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch analytics', error: err?.message });
  }
};

/* ==============================
   COMMUNICATIONS
   ============================== */

export const getCommunications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;

    // Fetch messages where user is sender or receiver
    // Join with users to get names
    const [rows]: any = await db.execute(
      `SELECT c.*, 
              s.name as sender_name, 
              r.name as receiver_name 
       FROM communications c
       LEFT JOIN users s ON c.sender_id = s.id
       LEFT JOIN users r ON c.receiver_id = r.id
       WHERE c.sender_id = ? OR c.receiver_id = ?
       ORDER BY c.created_at DESC`,
      [userId, userId]
    );

    res.status(200).json({ status: 'success', data: rows });
  } catch (err: any) {
    logger.error('getCommunications error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch communications' });
  }
};

export const getContentManagers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();

    // Fetch users with role 'content_manager' or 'admin' 
    // Assuming 'admin' acts as CM or there is a specific 'content_manager' role.
    // Based on previous context, role is likely 'content_manager' or 'admin'.
    const [rows]: any = await db.execute(
      `SELECT id, name, email, role FROM users WHERE role IN ('content_manager', 'admin')`
    );

    res.status(200).json({ status: 'success', data: rows });
  } catch (err: any) {
    logger.error('getContentManagers error', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch content managers' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { receiverId, subject, message } = req.body;

    if (!receiverId || !message) {
      res.status(400).json({ status: 'error', message: 'Missing receiver or message' });
      return;
    }

    await db.execute(
      `INSERT INTO communications (id, sender_id, receiver_id, message, type, created_at, is_read)
       VALUES (UUID(), ?, ?, ?, 'message', NOW(), false)`,
      [userId, receiverId, message] // We can probably prepend subject to message or ignore it since table might not have subject
    );

    res.status(200).json({ status: 'success', message: 'Message sent' });
  } catch (err: any) {
    logger.error('sendMessage error', err);
    res.status(500).json({ status: 'error', message: 'Failed to send message' });
  }
};
