// src/controllers/article.controller.ts
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { validationResult } from 'express-validator';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { getStorageBucket, getSignedUrl } from '../utils/storage';

// NOTE: removed GridFS/mongo imports

declare global {
  namespace Express {
    interface Request {
      user?: { userId?: string; role?: string; email?: string };
    }
  }
}

const MAX_SIGNED_URL_EXPIRES_MS = 15 * 60 * 1000; // 15 minutes
const READ_SIGNED_URL_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const requireAuth = (req: Request, res: Response): boolean => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
    return false;
  }
  return true;
};

// normalize possible outputs from getSignedUrl: string | [string] | { url }
const normalizeSignedUrl = (val: any): string | null => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0];
  if (typeof val === 'object' && val !== null) {
    if (typeof val.url === 'string') return val.url;
    if (typeof val.publicUrl === 'string') return val.publicUrl;
    if (typeof val.public_url === 'string') return val.public_url;
  }
  return null;
};

/**
 * POST /api/author/articles
 */
export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      return;
    }

    const db: any = getDatabase();
    const authorId = req.user!.userId!;
    const {
      title,
      summary = '',
      content = '',
      category_id = null,
      tags = [],
      status = 'draft',
      issue_id = null,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ status: 'error', message: 'Title is required' });
      return;
    }

    // Validate category (categories use category_id column)
    let finalCategoryId: string | null = null;
    if (category_id && typeof category_id === 'string' && category_id.trim()) {
      try {
        const [catRows]: any = await db.execute(
          'SELECT category_id FROM categories WHERE category_id = ? AND is_active = 1',
          [category_id.trim()]
        );
        if (catRows && catRows.length > 0) finalCategoryId = category_id.trim();
        else finalCategoryId = null;
      } catch (e) {
        logger.warn('Category validation failed, proceeding without category', e);
        finalCategoryId = null;
      }
    }

    const articleId = uuidv4();
    const metadata = JSON.stringify({ issue_id, tags: tags || [] });

    const insertSql = `
      INSERT INTO content (
        id, title, author_id, category_id, content, summary, tags, status, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    try {
      await db.execute(insertSql, [
        articleId,
        title.trim(),
        authorId,
        finalCategoryId,
        content || '',
        summary || '',
        JSON.stringify(tags || []),
        status,
        metadata,
      ]);
    } catch (dbError: any) {
      // if FK constraint fails for category, retry with null
      if (dbError && dbError.code === 'ER_NO_REFERENCED_ROW_2' && dbError.sqlMessage?.includes('category')) {
        logger.warn('FK error for category, retrying without category', { err: dbError.message });
        await db.execute(insertSql, [
          articleId,
          title.trim(),
          authorId,
          null,
          content || '',
          summary || '',
          JSON.stringify(tags || []),
          status,
          metadata,
        ]);
        finalCategoryId = null;
      } else {
        throw dbError;
      }
    }

    // Insert workflow event
    await db.execute(
      `INSERT INTO workflow_events (id, article_id, actor_id, from_status, to_status, note, created_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
      [articleId, authorId, null, status, `Created as ${status}`]
    );

    res.status(201).json({
      status: 'success',
      message: 'Article created',
      data: { id: articleId, title: title.trim(), status, category_id: finalCategoryId, summary: summary || '' },
    });
    return;
  } catch (err: any) {
    logger.error('createArticle error:', err);
    const errorMessage = err?.sqlMessage || err?.message || 'Unknown database error';
    const errorCode = err?.code || 'UNKNOWN_ERROR';
    res.status(500).json({ status: 'error', message: 'Failed to create article', error: errorMessage, code: errorCode });
    return;
  }
};

/**
 * GET /api/author/articles/categories
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();

    // First try the schema we use: category_id
    try {
      const [rows]: any = await db.execute(
        'SELECT category_id as id, name, description, slug, is_active FROM categories WHERE is_active = 1 ORDER BY name'
      );
      res.status(200).json({ status: 'success', data: { categories: rows } });
      return;
    } catch (err: any) {
      logger.warn('getCategories: SELECT category_id failed, trying fallback', err?.message);
    }

    // fallback to id if schema differs
    try {
      const [rows2]: any = await db.execute(
        'SELECT id as id, name, description, slug, is_active FROM categories WHERE is_active = 1 ORDER BY name'
      );
      res.status(200).json({ status: 'success', data: { categories: rows2 } });
      return;
    } catch (err2: any) {
      logger.error('getCategories: fallback also failed', err2);
      res.status(500).json({ status: 'error', message: 'Failed to fetch categories', error: err2?.message });
      return;
    }
  } catch (err: any) {
    logger.error('getCategories error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch categories', error: err?.message });
    return;
  }
};

/**
 * Deprecated signed URL endpoints: kept for compatibility but intentionally return 501 guidance.
 */
export const getAttachmentSignedUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;

    res.status(501).json({
      status: 'error',
      message:
        'Signed-upload is disabled. Upload attachments to the server using multipart POST to /api/author/articles/:articleId/attachments (field name "file").',
      alternative: { method: 'POST', path: `/api/author/articles/:articleId/attachments`, formField: 'file' },
    });
    return;
  } catch (err: any) {
    logger.error('getAttachmentSignedUrl error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to process request', error: err?.message });
    return;
  }
};

export const completeAttachmentUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;

    res.status(501).json({
      status: 'error',
      message:
        'Complete upload endpoint is deprecated. Upload files via multipart to /api/author/articles/:articleId/attachments which finalizes upload server-side.',
    });
    return;
  } catch (err: any) {
    logger.error('completeAttachmentUpload error (deprecated):', err);
    res.status(500).json({ status: 'error', message: 'Failed to process request', error: err?.message });
    return;
  }
};

/* ===========================
   GCS-backed attachment APIs
   =========================== */

/**
 * POST /api/author/articles/:articleId/attachments
 * multipart/form-data field: file
 *
 * router should attach multer middleware on this route: upload.single('file')
 */
export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const dbMy: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId } = req.params;

    // Validate article exists and ownership in MySQL
    const [articleRows]: any = await dbMy.execute('SELECT id, author_id FROM content WHERE id = ?', [articleId]);
    if (!articleRows || articleRows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }
    const article = articleRows[0];
    if (article.author_id !== userId && !['admin', 'content_manager'].includes(req.user!.role || '')) {
      res.status(403).json({ status: 'error', message: 'Forbidden to upload for this article' });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ status: 'error', message: 'No file provided' });
      return;
    }

    const attachmentId = uuidv4();
    const originalName = file.originalname || `attachment-${attachmentId}`;
    const contentType = file.mimetype || 'application/octet-stream';

    const safeName = originalName.replace(/[^\w.\-]/g, '_').slice(0, 200);
    const destPath = `attachments/${articleId}/${attachmentId}-${safeName}`;

    try {
      const bucket = getStorageBucket();
      const gcsFile = bucket.file(destPath);

      // Save buffer to GCS
      await gcsFile.save(file.buffer, {
        metadata: {
          contentType,
        },
        resumable: false,
      });

      // Optionally set ACL or make public — keep null and use signed URLs for reads
      const publicUrl = null;
      const sizeBytes = file.size || (file.buffer ? file.buffer.length : 0);

      // Save metadata in MySQL attachments table
      await dbMy.execute(
        `INSERT INTO attachments (id, article_id, storage_path, public_url, filename, mime_type, size_bytes, uploaded_by, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [attachmentId, articleId, destPath, publicUrl, originalName, contentType, sizeBytes, userId]
      );

      res.status(201).json({
        status: 'success',
        message: 'File uploaded to Firebase Storage',
        data: {
          attachmentId,
          storagePath: destPath,
          filename: originalName,
          size: sizeBytes,
          mime_type: contentType,
        },
      });
      return;
    } catch (err: any) {
      logger.error('uploadAttachment: failed to upload to GCS or save DB row', err);
      res.status(500).json({ status: 'error', message: 'Upload failed', error: err?.message });
      return;
    }
  } catch (err: any) {
    logger.error('uploadAttachment error', err);
    if (!res.headersSent) res.status(500).json({ status: 'error', message: 'Upload failed', error: err?.message });
  }
};

/**
 * GET /api/author/articles/:articleId/attachments/:attachmentId
 * Redirection to signed URL or public URL
 */
export const downloadAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const dbMy: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId, attachmentId } = req.params;

    const [rows]: any = await dbMy.execute('SELECT * FROM attachments WHERE id = ? AND article_id = ?', [attachmentId, articleId]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Attachment not found' });
      return;
    }
    const att = rows[0];

    // Permission: allow author or privileged roles
    if (att.uploaded_by !== userId && !['admin', 'content_manager', 'editor'].includes(req.user!.role || '')) {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    const storagePath: string = att.storage_path || '';
    // Assume storagePath is a GCS path relative to bucket (e.g., attachments/<articleId>/file.pdf)
    try {
      const bucketGCS = getStorageBucket();
      // if stored with a 'gcs/' prefix previously, handle it
      const gcsPath = storagePath.startsWith('gcs/') ? storagePath.slice(4) : storagePath;

      // If the DB row already contains a public_url, redirect directly
      if (att.public_url) {
        res.redirect(att.public_url);
        return;
      }

      // Ask utils for a signed read URL
      const rawReadUrl = await getSignedUrl(gcsPath, 'read', READ_SIGNED_URL_EXPIRES_MS);
      const readUrl = normalizeSignedUrl(rawReadUrl);
      if (readUrl) {
        res.redirect(readUrl);
        return;
      }

      // Fallback: try to make file public (best-effort)
      try {
        const file = bucketGCS.file(gcsPath);
        await file.makePublic();
        const bucketName = (bucketGCS as any).name || process.env.FIREBASE_STORAGE_BUCKET;
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURI(gcsPath)}`;
        // Update DB public_url (best-effort)
        try {
          await dbMy.execute('UPDATE attachments SET public_url = ? WHERE id = ?', [publicUrl, attachmentId]);
        } catch (e) {
          logger.warn('Failed to update attachments.public_url after makePublic', e);
        }
        res.redirect(publicUrl);
        return;
      } catch (e) {
        logger.warn('downloadAttachment: could not create signed URL and makePublic failed', e);
        res.status(500).json({ status: 'error', message: 'Failed to provide file' });
        return;
      }
    } catch (e: any) {
      logger.error('downloadAttachment (GCS) error', e);
      res.status(500).json({ status: 'error', message: 'Failed to provide attachment', error: e?.message });
      return;
    }
  } catch (err: any) {
    logger.error('downloadAttachment error', err);
    if (!res.headersSent) res.status(500).json({ status: 'error', message: 'Failed to download attachment', error: err?.message });
    return;
  }
};

/**
 * DELETE /api/author/articles/:articleId/attachments/:attachmentId
 */
export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const dbMy: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId, attachmentId } = req.params;

    const [rows]: any = await dbMy.execute('SELECT * FROM attachments WHERE id = ? AND article_id = ?', [attachmentId, articleId]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Attachment not found' });
      return;
    }
    const att = rows[0];

    // permission check
    if (att.uploaded_by !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    const storagePath: string = att.storage_path || '';
    try {
      const bucketGCS = getStorageBucket();
      const gcsPath = storagePath.startsWith('gcs/') ? storagePath.slice(4) : storagePath;
      if (gcsPath) {
        const file = bucketGCS.file(gcsPath);
        await file.delete().catch(() => {
          logger.warn(`Could not delete file from GCS: ${gcsPath} (may not exist)`);
        });
      }
    } catch (e) {
      logger.warn('deleteAttachment: failed to delete from GCS', e);
    }

    // remove metadata row
    await dbMy.execute('DELETE FROM attachments WHERE id = ?', [attachmentId]);

    res.status(200).json({ status: 'success', message: 'Attachment deleted' });
    return;
  } catch (err: any) {
    logger.error('deleteAttachment error:', err);
    if (!res.headersSent) res.status(500).json({ status: 'error', message: 'Failed to delete attachment', error: err?.message });
    return;
  }
};

/**
 * GET /api/author/articles
 */
export const listAuthorArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const authorId = req.user!.userId!;

    const { status, limit = '50', offset = '0' } = req.query as any;

    let articlesQuery = `
      SELECT
        c.id, c.title, c.status, c.created_at, c.updated_at,
        c.reads_count AS views, c.likes_count AS likes,
        c.category_id, c.summary, c.metadata,
        (SELECT public_url FROM attachments a WHERE a.article_id = c.id LIMIT 1) AS attachment_url
      FROM content c
    `;

    const queryParams: any[] = [];
    const whereConditions: string[] = [];

    try {
      const [exactMatchCount]: any = await db.execute('SELECT COUNT(*) as count FROM content WHERE author_id = ?', [authorId]);
      const countVal = exactMatchCount && exactMatchCount[0] ? exactMatchCount[0].count : 0;
      if (countVal > 0) {
        whereConditions.push('c.author_id = ?');
        queryParams.push(authorId);
      } else {
        const pattern = `${String(authorId).substring(0, 36)}%`;
        whereConditions.push('c.author_id LIKE ?');
        queryParams.push(pattern);
      }
    } catch (e) {
      logger.warn('Error checking author_id exact match; using pattern', e);
      const pattern = `${String(authorId).substring(0, 30)}%`;
      whereConditions.push('c.author_id LIKE ?');
      queryParams.push(pattern);
    }

    if (status && typeof status === 'string' && status.trim()) {
      const statusArray = status.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (statusArray.length > 0) {
        const placeholders = statusArray.map(() => '?').join(',');
        whereConditions.push(`c.status IN (${placeholders})`);
        queryParams.push(...statusArray);
      }
    }

    if (whereConditions.length > 0) articlesQuery += ' WHERE ' + whereConditions.join(' AND ');

    const limitNum = Math.max(1, Math.min(1000, parseInt(String(limit), 10) || 50));
    const offsetNum = Math.max(0, parseInt(String(offset), 10) || 0);
    articlesQuery += ` ORDER BY c.updated_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [rows]: any = await db.execute(articlesQuery, queryParams);

    const articles = (rows || []).map((row: any) => {
      let category = 'General';
      let metadata: any = {};
      let summary = row.summary || '';

      try {
        if (row.metadata) {
          if (typeof row.metadata === 'string') {
            metadata = JSON.parse(row.metadata || '{}');
          } else metadata = row.metadata || {};
          if (metadata.category) category = metadata.category;
          if (!summary && metadata.summary) summary = metadata.summary;
        }
      } catch (e) {
        logger.warn('Error processing metadata', e);
      }

      if (category === 'General' && row.category_id) category = row.category_id;

      return {
        id: row.id,
        title: row.title || 'Untitled',
        status: row.status || 'draft',
        created_at: row.created_at,
        updated_at: row.updated_at,
        views: row.views || 0,
        likes: row.likes || 0,
        category_id: row.category_id,
        summary,
        metadata,
        category,
        attachment_url: row.attachment_url,
        publishedAt: row.created_at,
      };
    });

    res.status(200).json({ status: 'success', message: 'Articles fetched successfully', data: { articles } });
    return;
  } catch (err: any) {
    logger.error('listAuthorArticles error:', err);
    // fallback: simpler pattern-match query
    try {
      const db: any = getDatabase();
      const authorId = req.user!.userId!;
      const pattern = `${String(authorId).substring(0, 30)}%`;
      const [rows]: any = await db.execute(
        `SELECT id, title, status, created_at, updated_at FROM content WHERE author_id LIKE ? ORDER BY updated_at DESC LIMIT 20`,
        [pattern]
      );
      const articles = (rows || []).map((r: any) => ({ id: r.id, title: r.title, status: r.status, publishedAt: r.created_at, created_at: r.created_at, updated_at: r.updated_at }));
      res.status(200).json({ status: 'success', message: 'Articles fetched (fallback)', data: { articles } });
      return;
    } catch (fallbackErr: any) {
      logger.error('listAuthorArticles fallback failed:', fallbackErr);
      res.status(200).json({ status: 'success', message: 'No articles found', data: { articles: [] } });
      return;
    }
  }
};

/**
 * GET /api/author/articles/:articleId
 */
export const getArticleDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId } = req.params;

    const [rows]: any = await db.execute('SELECT * FROM content WHERE id = ?', [articleId]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    const article = rows[0];
    const privileged = ['admin', 'content_manager', 'editor', 'reviewer'];
    if (article.author_id !== userId && !privileged.includes(req.user!.role || '')) {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    const [attachments]: any = await db.execute('SELECT id, filename, public_url, storage_path, mime_type, size_bytes, uploaded_at FROM attachments WHERE article_id = ?', [articleId]);
    const [events]: any = await db.execute('SELECT id, actor_id, from_status, to_status, note, created_at FROM workflow_events WHERE article_id = ? ORDER BY created_at DESC', [articleId]);
    const [reviews]: any = await db.execute('SELECT id, reviewer_id, summary, details, decision, similarity_score, created_at FROM reviews WHERE article_id = ? ORDER BY created_at DESC', [articleId]);

    res.status(200).json({ status: 'success', message: 'Article details fetched', data: { article, attachments, workflow: events, reviews } });
    return;
  } catch (err: any) {
    logger.error('getArticleDetails error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch article details', error: err?.message });
    return;
  }
};

/**
 * PATCH /api/author/articles/:articleId/status
 */
export const updateArticleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId } = req.params;
    const { status, note = '' } = req.body;

    if (!status) {
      res.status(400).json({ status: 'error', message: 'Status is required' });
      return;
    }

    const [rows]: any = await db.execute('SELECT author_id, status FROM content WHERE id = ?', [articleId]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    const article = rows[0];

    if (article.author_id === userId) {
      if (!['submitted', 'draft'].includes(status)) {
        res.status(403).json({ status: 'error', message: 'Author cannot set this status' });
        return;
      }
    } else {
      const allowedRoles = ['admin', 'content_manager', 'editor', 'reviewer'];
      if (!allowedRoles.includes(req.user!.role || '')) {
        res.status(403).json({ status: 'error', message: 'Forbidden' });
        return;
      }
    }

    await db.execute('UPDATE content SET status = ?, updated_at = NOW() WHERE id = ?', [status, articleId]);

    // Insert workflow event
    await db.execute(
      `INSERT INTO workflow_events (id, article_id, actor_id, from_status, to_status, note, created_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
      [articleId, userId, article.status, status, note]
    );

    logger.info(`Article ${articleId} status changed from ${article.status} to ${status} by ${userId}`);
    res.status(200).json({ status: 'success', message: 'Status updated', data: { id: articleId, status } });
    return;
  } catch (err: any) {
    logger.error('updateArticleStatus error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update status', error: err?.message });
    return;
  }
};

/**
 * DELETE /api/author/articles/:articleId
 */
export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId } = req.params;

    const [rows]: any = await db.execute('SELECT author_id, status FROM content WHERE id = ?', [articleId]);
    if (!rows || rows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    const article = rows[0];

    if (article.author_id !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    if (article.status !== 'draft' && req.user!.role !== 'admin') {
      res.status(400).json({ status: 'error', message: 'Only drafts can be deleted by the author' });
      return;
    }

    // Delete attachments from storage and DB
    const [attachments]: any = await db.execute('SELECT id, storage_path FROM attachments WHERE article_id = ?', [articleId]);
    const bucketGCS = getStorageBucket();

    for (const att of attachments || []) {
      try {
        const storagePath = att.storage_path || '';
        const gcsPath = storagePath.startsWith('gcs/') ? storagePath.slice(4) : storagePath;
        if (gcsPath) {
          const file = bucketGCS.file(gcsPath);
          await file.delete().catch(() => {
            logger.warn(`Could not delete file from storage: ${gcsPath} (may not exist)`);
          });
        }
      } catch (e) {
        logger.warn('Error deleting file from storage', e);
      }
    }

    await db.execute('DELETE FROM attachments WHERE article_id = ?', [articleId]);
    await db.execute('DELETE FROM workflow_events WHERE article_id = ?', [articleId]);
    await db.execute('DELETE FROM reviews WHERE article_id = ?', [articleId]);
    await db.execute('DELETE FROM content WHERE id = ?', [articleId]);

    logger.info(`Article ${articleId} deleted by ${userId}`);
    res.status(200).json({ status: 'success', message: 'Article deleted' });
    return;
  } catch (err: any) {
    logger.error('deleteArticle error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete article', error: err?.message });
    return;
  }
};
