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



import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import archiver from 'archiver'; // npm i archiver

/**
 * POST /api/admin/articles/:articleId/plagiarism
 *
 * Runs JPlag (via Docker) against attachments for an article and saves
 * a zipped report to storage, and a metadata row in plagiarism_reports.
 *
 * NOTE: requires Docker on host OR replace the docker exec with `java -jar jplag.jar`.
 * Env vars used:
 *  - process.env.JPLAG_DOCKER_IMAGE  (e.g. ghcr.io/edulinq/jplag-docker:latest)
 *  - process.env.JPLAG_THREADS
 */
const JPLAG_DOCKER_IMAGE = process.env.JPLAG_DOCKER_IMAGE || 'ghcr.io/edulinq/jplag-docker:latest';
const JPLAG_THREADS = process.env.JPLAG_THREADS || '4';

// Replace your existing runPlagiarismCheck with this function
export const runPlagiarismCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // require authentication middleware to have populated req.user
    if (!req.user || !req.user.userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const db: any = getDatabase();
    const { articleId } = req.params;
    if (!articleId) {
      res.status(400).json({ status: 'error', message: 'articleId required' });
      return;
    }

    // Fetch article to verify existence and get author_id
    const [articleRows]: any = await db.execute('SELECT id, author_id FROM content WHERE id = ?', [articleId]);
    if (!articleRows || articleRows.length === 0) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }
    const article = articleRows[0];
    const callerUserId = req.user!.userId!;
    const callerRole = req.user!.role || '';

    // Authorization: allow privileged roles OR the article's author
    const privileged = ['admin', 'content_manager', 'editor'];
    const isAuthor = String(article.author_id) === String(callerUserId);
    if (!privileged.includes(callerRole) && !isAuthor) {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    // Fetch attachments for the article (same as before)
    const [attachments]: any = await db.execute(
      'SELECT id, filename, storage_path, public_url FROM attachments WHERE article_id = ?',
      [articleId]
    );
    if (!attachments || attachments.length === 0) {
      res.status(404).json({ status: 'error', message: 'No attachments found to run JPlag on' });
      return;
    }

    // Create temp working dir
    const workRoot = await fs.mkdtemp(path.join(os.tmpdir(), `jplag-${articleId}-`));
    const submissionsDir = path.join(workRoot, 'submissions');
    await fs.mkdir(submissionsDir);

    // Download attachments to submissions dir
    const bucket = getStorageBucket();
    for (const att of attachments) {
      const fname = att.filename || att.id;
      const localPath = path.join(submissionsDir, `${att.id}-${fname}`);
      if (att.public_url) {
        const fetch = (await import('node-fetch')).default;
        const resp = await fetch(att.public_url);
        if (!resp.ok) throw new Error(`Failed to download ${att.public_url}`);
        const buffer = Buffer.from(await resp.arrayBuffer());
        await fs.writeFile(localPath, buffer);
      } else if (att.storage_path) {
        const gcsPath = att.storage_path.startsWith('gcs/') ? att.storage_path.slice(4) : att.storage_path;
        const file = bucket.file(gcsPath);
        await file.download({ destination: localPath });
      } else {
        logger.warn('attachment missing storage reference', att);
      }
    }

    // Decide JPlag language (body.language or default)
    const language = (req.body && req.body.language) || 'python3';

    // Create out dir
    const resultDir = path.join(workRoot, 'out');
    await fs.mkdir(resultDir);

    // Build docker args (respect env defaults)
    const dockerImage = process.env.JPLAG_DOCKER_IMAGE || 'ghcr.io/edulinq/jplag-docker:latest';
    const threads = process.env.JPLAG_THREADS || '4';

    const dockerArgs = [
      'run', '--rm',
      '-v', `${workRoot}:/jplag:Z`,
      dockerImage,
      '--mode', 'RUN',
      '--csv-export',
      '--language', language,
      '-t', threads,
      '/jplag/submissions'
    ];

    logger.info('Running JPlag docker', { dockerArgs });

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('docker', dockerArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
      proc.stdout.on('data', (d) => logger.info(`[jplag] ${d.toString()}`));
      proc.stderr.on('data', (d) => logger.warn(`[jplag-err] ${d.toString()}`));
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`jplag docker exited with code ${code}`));
      });
      proc.on('error', reject);
    });

    // Locate report directory (try common names)
    const possibleOut = ['out', 'report', 'jplag-out', 'results'].map(n => path.join(workRoot, n));
    let reportPath: string | null = null;
    for (const p of possibleOut) {
      try {
        const stat = await fs.stat(p);
        if (stat && stat.isDirectory()) {
          reportPath = p;
          break;
        }
      } catch (e) {
        // continue
      }
    }
    if (!reportPath) reportPath = workRoot;

    // Zip the report
    const reportZipPath = path.join(workRoot, 'jplag-report.zip');
    await zipFolder(reportPath, reportZipPath);

    // Upload zip to storage
    const reportId = uuidv4();
    const storagePath = `plagiarism_reports/${articleId}/${reportId}.zip`;
    const file = bucket.file(storagePath);
    await file.save(await fs.readFile(reportZipPath), {
      metadata: { contentType: 'application/zip' },
      resumable: false,
    });

    // Create signed URL (7 days)
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });

    // Parse CSV if available (best-effort)
    let similaritySummary: any = {};
    try {
      const csvPath = path.join(reportPath, 'report.csv');
      const csvExists = await exists(csvPath);
      if (csvExists) {
        const csv = await fs.readFile(csvPath, 'utf8');
        similaritySummary = parseJPlagCsv(csv);
      } else {
        const files = await fs.readdir(reportPath);
        const csvFile = files.find((f) => f.toLowerCase().endsWith('.csv'));
        if (csvFile) {
          const csv = await fs.readFile(path.join(reportPath, csvFile), 'utf8');
          similaritySummary = parseJPlagCsv(csv);
        } else {
          similaritySummary = { notice: 'no-csv-found', files };
        }
      }
    } catch (e) {
      logger.warn('Failed to parse jplag csv', e);
    }

    // Persist report metadata
    await db.execute(
      `INSERT INTO plagiarism_reports (id, article_id, run_by, similarity_summary, report_storage_path, report_public_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        reportId,
        articleId,
        req.user!.userId || null,
        JSON.stringify(similaritySummary),
        storagePath,
        signedUrl,
        'completed'
      ]
    );

    // (optional) cleanup temp directory if you want:
    // await fs.rm(workRoot, { recursive: true, force: true });

    res.status(201).json({
      status: 'success',
      message: 'Plagiarism check completed',
      data: {
        reportId,
        reportUrl: signedUrl,
        summary: similaritySummary,
      },
    });
    return;
  } catch (err: any) {
    logger.error('runPlagiarismCheck error', err);
    res.status(500).json({ status: 'error', message: 'Plagiarism check failed', error: err?.message || String(err) });
    return;
  }
};

/* ---------- helper utilities used above ---------- */

async function exists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function zipFolder(folderPath: string, outPath: string) {
  return new Promise<void>((resolve, reject) => {
    const output = require('fs').createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 }});
    output.on('close', () => resolve());
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
}

/**
 * Naive CSV parser: expects header + rows where similarity column exists.
 * Adjust per your JPlag docker CSV layout if needed.
 */
function parseJPlagCsv(csv: string) {
  const lines = csv.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return { notice: 'no-rows' };
  const header = lines[0].split(',');
  const rows = lines.slice(1).map(r => r.split(',').map(c => c.trim()));
  let simIdx = header.findIndex(h => /similar/i.test(h));
  if (simIdx < 0) simIdx = header.length - 1;
  const pairs = rows.map(cols => ({
    a: cols[0],
    b: cols[1],
    similarity: parseFloat(cols[simIdx]) || 0
  }));
  const max = pairs.reduce((m, p) => (p.similarity > m ? p.similarity : m), 0);
  const avg = pairs.reduce((s, p) => s + p.similarity, 0) / Math.max(1, pairs.length);
  return { max_similarity: max, avg_similarity: avg, pairs: pairs.slice(0, 20) };
}
