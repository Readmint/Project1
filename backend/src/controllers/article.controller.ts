// src/controllers/article.controller.ts
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { validationResult } from 'express-validator';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { getStorageBucket, getSignedUrl } from '../utils/storage';

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
  if (typeof val === 'object') {
    if (val.url && typeof val.url === 'string') return val.url;
    if (val.publicUrl && typeof val.publicUrl === 'string') return val.publicUrl;
    if (val.public_url && typeof val.public_url === 'string') return val.public_url;
  }
  return null;
};

/**
 * POST /api/author/articles
 */
export const createArticle = async (req: Request, res: Response): Promise<any> => {
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

    return res.status(201).json({
      status: 'success',
      message: 'Article created',
      data: { id: articleId, title: title.trim(), status, category_id: finalCategoryId, summary: summary || '' },
    });
  } catch (err: any) {
    logger.error('createArticle error:', err);
    const errorMessage = err?.sqlMessage || err?.message || 'Unknown database error';
    const errorCode = err?.code || 'UNKNOWN_ERROR';
    return res.status(500).json({ status: 'error', message: 'Failed to create article', error: errorMessage, code: errorCode });
  }
};

/**
 * GET /api/author/articles/categories
 */
export const getCategories = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();

    // First try the schema we use: category_id
    try {
      const [rows]: any = await db.execute(
        'SELECT category_id as id, name, description, slug, is_active FROM categories WHERE is_active = 1 ORDER BY name'
      );
      return res.status(200).json({ status: 'success', data: { categories: rows } });
    } catch (err: any) {
      logger.warn('getCategories: SELECT category_id failed, trying fallback', err?.message);
    }

    // fallback to id if schema differs
    try {
      const [rows2]: any = await db.execute(
        'SELECT id as id, name, description, slug, is_active FROM categories WHERE is_active = 1 ORDER BY name'
      );
      return res.status(200).json({ status: 'success', data: { categories: rows2 } });
    } catch (err2: any) {
      logger.error('getCategories: fallback also failed', err2);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch categories', error: err2?.message });
    }
  } catch (err: any) {
    logger.error('getCategories error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch categories', error: err?.message });
  }
};

/**
 * POST /api/author/articles/:articleId/attachments/signed-url
 */
export const getAttachmentSignedUrl = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!requireAuth(req, res)) return;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
    }

    const db: any = getDatabase();
    const { articleId } = req.params;
    const { filename, contentType = 'application/octet-stream' } = req.body;
    const userId = req.user!.userId!;

    if (!filename) return res.status(400).json({ status: 'error', message: 'filename is required' });

    const [rows]: any = await db.execute('SELECT id, author_id, status FROM content WHERE id = ?', [articleId]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: 'error', message: 'Article not found' });

    const article = rows[0];
    if (article.author_id !== userId && !['admin', 'content_manager'].includes(req.user!.role || '')) {
      return res.status(403).json({ status: 'error', message: 'Forbidden to upload for this article' });
    }

    const attachmentId = uuidv4();
    const safeFilename = filename.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const storagePath = `articles/${articleId}/attachments/${attachmentId}--${safeFilename}`;

    const rawUploadUrl = await getSignedUrl(storagePath, 'write', MAX_SIGNED_URL_EXPIRES_MS, { contentType });
    const uploadUrl = normalizeSignedUrl(rawUploadUrl);

    if (!uploadUrl) {
      logger.error('getAttachmentSignedUrl: signed url generation returned invalid result', { raw: rawUploadUrl });
      return res.status(500).json({ status: 'error', message: 'Failed to generate upload URL' });
    }

    await db.execute(
      `INSERT INTO attachments (id, article_id, storage_path, public_url, filename, mime_type, size_bytes, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [attachmentId, articleId, storagePath, null, filename, contentType, null, userId]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Signed upload URL generated',
      data: { attachmentId, uploadUrl, storagePath, expiresAt: Date.now() + MAX_SIGNED_URL_EXPIRES_MS },
    });
  } catch (err: any) {
    logger.error('getAttachmentSignedUrl error:', err);
    let errorMessage = 'Failed to generate signed URL';
    if (err?.message && err.message.includes('Bucket name not specified')) errorMessage = 'Storage bucket not configured. Check FIREBASE_STORAGE_BUCKET.';
    return res.status(500).json({ status: 'error', message: errorMessage, error: err?.message });
  }
};

/**
 * POST /api/author/articles/:articleId/attachments/:attachmentId/complete
 */
export const completeAttachmentUpload = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId, attachmentId } = req.params;
    const { makePublic = false } = req.body;

    const [rows]: any = await db.execute('SELECT * FROM attachments WHERE id = ? AND article_id = ?', [attachmentId, articleId]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: 'error', message: 'Attachment not found' });

    const attachment = rows[0];
    if (attachment.uploaded_by !== userId && !['admin', 'content_manager'].includes(req.user!.role || '')) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const bucket = getStorageBucket();
    const file = bucket.file(attachment.storage_path);

    let meta: any = {};
    try {
      const [fileMeta] = await file.getMetadata();
      meta = fileMeta || {};
    } catch (e) {
      logger.warn('Unable to read storage metadata for file:', attachment.storage_path, e);
    }

    const sizeBytes = meta.size ? parseInt(String(meta.size), 10) : null;
    const mimeType = meta.contentType || attachment.mime_type || null;

    let publicUrl: string | null = null;
    if (makePublic) {
      try {
        const rawReadUrl = await getSignedUrl(attachment.storage_path, 'read', READ_SIGNED_URL_EXPIRES_MS);
        publicUrl = normalizeSignedUrl(rawReadUrl);
      } catch (e) {
        logger.warn('Failed to create read signed url, attempting file.makePublic()', e);
        try {
          await file.makePublic();
          const bucketName = (getStorageBucket() as any).name || process.env.FIREBASE_STORAGE_BUCKET;
          publicUrl = `https://storage.googleapis.com/${bucketName}/${attachment.storage_path}`;
        } catch (err) {
          logger.warn('Failed to make file public', err);
        }
      }
    }

    await db.execute(
      `UPDATE attachments SET public_url = ?, mime_type = ?, size_bytes = ?, uploaded_at = NOW() WHERE id = ?`,
      [publicUrl, mimeType, sizeBytes, attachmentId]
    );

    return res.status(200).json({ status: 'success', message: 'Attachment finalized', data: { attachmentId, publicUrl, mimeType, sizeBytes } });
  } catch (err: any) {
    logger.error('completeAttachmentUpload error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to finalize attachment', error: err?.message });
  }
};

/**
 * GET /api/author/articles
 */
export const listAuthorArticles = async (req: Request, res: Response): Promise<any> => {
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

    return res.status(200).json({ status: 'success', message: 'Articles fetched successfully', data: { articles } });
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
      return res.status(200).json({ status: 'success', message: 'Articles fetched (fallback)', data: { articles } });
    } catch (fallbackErr: any) {
      logger.error('listAuthorArticles fallback failed:', fallbackErr);
      return res.status(200).json({ status: 'success', message: 'No articles found', data: { articles: [] } });
    }
  }
};

/**
 * GET /api/author/articles/:articleId
 */
export const getArticleDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId } = req.params;

    const [rows]: any = await db.execute('SELECT * FROM content WHERE id = ?', [articleId]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: 'error', message: 'Article not found' });

    const article = rows[0];
    const privileged = ['admin', 'content_manager', 'editor', 'reviewer'];
    if (article.author_id !== userId && !privileged.includes(req.user!.role || '')) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const [attachments]: any = await db.execute('SELECT id, filename, public_url, storage_path, mime_type, size_bytes, uploaded_at FROM attachments WHERE article_id = ?', [articleId]);
    const [events]: any = await db.execute('SELECT id, actor_id, from_status, to_status, note, created_at FROM workflow_events WHERE article_id = ? ORDER BY created_at DESC', [articleId]);
    const [reviews]: any = await db.execute('SELECT id, reviewer_id, summary, details, decision, similarity_score, created_at FROM reviews WHERE article_id = ? ORDER BY created_at DESC', [articleId]);

    return res.status(200).json({ status: 'success', message: 'Article details fetched', data: { article, attachments, workflow: events, reviews } });
  } catch (err: any) {
    logger.error('getArticleDetails error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch article details', error: err?.message });
  }
};

/**
 * PATCH /api/author/articles/:articleId/status
 */
export const updateArticleStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId } = req.params;
    const { status, note = '' } = req.body;

    if (!status) return res.status(400).json({ status: 'error', message: 'Status is required' });

    const [rows]: any = await db.execute('SELECT author_id, status FROM content WHERE id = ?', [articleId]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: 'error', message: 'Article not found' });

    const article = rows[0];

    if (article.author_id === userId) {
      if (!['submitted', 'draft'].includes(status)) return res.status(403).json({ status: 'error', message: 'Author cannot set this status' });
    } else {
      const allowedRoles = ['admin', 'content_manager', 'editor', 'reviewer'];
      if (!allowedRoles.includes(req.user!.role || '')) return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    await db.execute('UPDATE content SET status = ?, updated_at = NOW() WHERE id = ?', [status, articleId]);

    // Insert workflow event
    await db.execute(
      `INSERT INTO workflow_events (id, article_id, actor_id, from_status, to_status, note, created_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
      [articleId, userId, article.status, status, note]
    );

    logger.info(`Article ${articleId} status changed from ${article.status} to ${status} by ${userId}`);
    return res.status(200).json({ status: 'success', message: 'Status updated', data: { id: articleId, status } });
  } catch (err: any) {
    logger.error('updateArticleStatus error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update status', error: err?.message });
  }
};

/**
 * DELETE /api/author/articles/:articleId
 */
export const deleteArticle = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!requireAuth(req, res)) return;
    const db: any = getDatabase();
    const userId = req.user!.userId!;
    const { articleId } = req.params;

    const [rows]: any = await db.execute('SELECT author_id, status FROM content WHERE id = ?', [articleId]);
    if (!rows || rows.length === 0) return res.status(404).json({ status: 'error', message: 'Article not found' });

    const article = rows[0];

    if (article.author_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    if (article.status !== 'draft' && req.user!.role !== 'admin') {
      return res.status(400).json({ status: 'error', message: 'Only drafts can be deleted by the author' });
    }

    // Delete attachments from storage and DB
    const [attachments]: any = await db.execute('SELECT id, storage_path FROM attachments WHERE article_id = ?', [articleId]);
    const bucket = admin.storage().bucket();

    for (const att of attachments || []) {
      try {
        const file = bucket.file(att.storage_path);
        await file.delete().catch(() => {
          logger.warn(`Could not delete file from storage: ${att.storage_path} (may not exist)`);
        });
      } catch (e) {
        logger.warn('Error deleting file from storage', e);
      }
    }

    await db.execute('DELETE FROM attachments WHERE article_id = ?', [articleId]);
    await db.execute('DELETE FROM workflow_events WHERE article_id = ?', [articleId]);
    await db.execute('DELETE FROM reviews WHERE article_id = ?', [articleId]);
    await db.execute('DELETE FROM content WHERE id = ?', [articleId]);

    logger.info(`Article ${articleId} deleted by ${userId}`);
    return res.status(200).json({ status: 'success', message: 'Article deleted' });
  } catch (err: any) {
    logger.error('deleteArticle error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to delete article', error: err?.message });
  }
};
