import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { validationResult } from 'express-validator';
import { getDatabase, getStorageBucket } from '../config/database';
import { logger } from '../utils/logger';
import { getSignedUrl } from '../utils/storage';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import archiver from 'archiver';
import { TfIdf } from 'natural';
import fetch from 'node-fetch';
import mammoth from 'mammoth';
import { getCollection, executeQuery, createDoc, updateDoc, getDoc, deleteDoc } from '../utils/firestore-helpers';

//
// Robust pdf-parse loader to handle ESM / CommonJS interop
//
let pdfParse: any = null;
try {
  // Prefer require for CommonJS environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const _pdf = require('pdf-parse');
  pdfParse = typeof _pdf === 'function' ? _pdf : (_pdf && _pdf.default) ? _pdf.default : _pdf;
} catch (cjsErr) {
  try {
    // Try dynamic import (for ESM environments)
    // Use import() but keep usage synchronous-safe: set pdfParse when resolved (may be null until then)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        const mod = await import('pdf-parse');
        pdfParse = mod?.default || mod;
        logger && logger.info && logger.info('pdf-parse loaded via dynamic import', { pdfParseType: typeof pdfParse });
      } catch (impErr) {
        pdfParse = null;
        logger && logger.warn && logger.warn('pdf-parse dynamic import failed; PDF parsing disabled', { cjsErr, impErr });
      }
    })();
  } catch (impErr) {
    pdfParse = null;
    logger && logger.warn && logger.warn('pdf-parse load failed; PDF parsing disabled', { cjsErr, impErr });
  }
}

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

    const authorId = req.user!.userId!;
    const {
      title,
      summary = '',
      content = '',
      category_id = null,
      tags = [],
      status = 'draft',
      issue_id = null,
      event_id = null,
      visibility = 'public',
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ status: 'error', message: 'Title is required' });
      return;
    }

    // Validate category
    let finalCategoryId: string | null = null;
    if (category_id && typeof category_id === 'string' && category_id.trim()) {
      try {
        // Firestore fetch
        const cat = await getDoc('categories', category_id.trim());
        if (cat && cat.is_active) finalCategoryId = category_id.trim();
        else finalCategoryId = null;
      } catch (e) {
        logger.warn('Category validation failed, proceeding without category', e);
        finalCategoryId = null;
      }
    }

    const articleId = uuidv4();
    const metadata = { issue_id, tags: tags || [] };
    // We store metadata as object now, not JSON string, for Firestore queries flexibility

    const finalEventId = (event_id && typeof event_id === 'string' && event_id.trim()) ? event_id.trim() : null;

    // Create article doc
    await createDoc('content', {
      title: title.trim(),
      author_id: authorId,
      category_id: finalCategoryId,
      content: content || '',
      summary: summary || '',
      tags: tags || [], // array
      language: req.body.language || 'English',
      status,
      metadata,
      event_id: finalEventId,
      visibility,
      co_authors: req.body.co_authors || [], // store as array directly
      reads_count: 0,
      likes_count: 0,
    }, articleId);

    // Insert workflow event
    await createDoc('workflow_events', {
      article_id: articleId,
      actor_id: authorId,
      from_status: null,
      to_status: status,
      note: `Created as ${status}`,
    });

    res.status(201).json({
      status: 'success',
      message: 'Article created',
      data: { id: articleId, title: title.trim(), status, category_id: finalCategoryId, summary: summary || '' },
    });
    return;
  } catch (err: any) {
    logger.error('createArticle error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create article', error: err?.message });
    return;
  }
};

/**
 * PATCH /api/author/articles/:articleId
 */
export const updateArticleContent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;

    const userId = req.user!.userId!;
    const { articleId } = req.params;
    const {
      title,
      summary,
      content,
      category_id,
      tags,
      issue_id,
      metadata
    } = req.body;

    const article: any = await getDoc('content', articleId);
    if (!article) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    // Check permissions
    if (article.author_id === userId) {
      if (!['draft', 'changes_requested', 'submitted'].includes(article.status)) {
        if (!['draft', 'changes_requested'].includes(article.status)) {
          res.status(403).json({ status: 'error', message: 'Cannot edit article in this status' });
          return;
        }
      }
    } else {
      const allowedRoles = ['admin', 'content_manager', 'editor'];
      if (!allowedRoles.includes(req.user!.role || '')) {
        res.status(403).json({ status: 'error', message: 'Forbidden' });
        return;
      }
    }

    // Build update object
    const updates: any = {};
    if (typeof title === 'string') updates.title = title.trim();
    if (typeof summary === 'string') updates.summary = summary;
    if (typeof content === 'string') updates.content = content;
    if (category_id !== undefined) updates.category_id = category_id || null;
    if (tags !== undefined) updates.tags = tags || [];
    if (req.body.language !== undefined) updates.language = req.body.language;
    if (req.body.co_authors !== undefined) updates.co_authors = req.body.co_authors;

    // Metadata handling
    if (metadata !== undefined) {
      // If metadata is passed as string, parse it, else use existing object logic
      updates.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    }

    // Handle issue_id merge into metadata if not explicitly provided in metadata obj
    if (issue_id && (!updates.metadata || !updates.metadata.issue_id)) {
      updates.metadata = { ...(updates.metadata || article.metadata || {}), issue_id };
    }

    if (Object.keys(updates).length === 0) {
      res.status(200).json({ status: 'success', message: 'No changes provided' });
      return;
    }

    await updateDoc('content', articleId, updates);

    res.status(200).json({ status: 'success', message: 'Article updated', data: { id: articleId } });
    return;
  } catch (err: any) {
    logger.error('updateArticleContent error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update article', error: err?.message });
    return;
  }
};

/**
 * GET /api/author/articles/categories
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;

    // Firestore fetch all categories where is_active == true
    const cats = await executeQuery('categories', [{ field: 'is_active', op: '==', value: true }], 100, { field: 'name', dir: 'asc' });

    res.status(200).json({ status: 'success', data: { categories: cats } });
    return;
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
      alternative: { method: 'POST', path: `/ api / author / articles /: articleId / attachments`, formField: 'file' },
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
    if (article.author_id !== userId && !['admin', 'content_manager', 'editor'].includes(req.user!.role || '')) {
      res.status(403).json({ status: 'error', message: 'Forbidden to upload for this article' });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ status: 'error', message: 'No file provided' });
      return;
    }

    const attachmentId = uuidv4();
    const originalName = file.originalname || `attachment - ${attachmentId} `;
    const contentType = file.mimetype || 'application/octet-stream';

    const safeName = originalName.replace(/[^\w.\-]/g, '_').slice(0, 200);
    const destPath = `attachments / ${articleId}/${attachmentId}-${safeName}`;

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

      // Make file public immediately so it can be viewed in <img> tags without auth
      await gcsFile.makePublic();
      const bucketName = bucket.name; // or process.env.FIREBASE_STORAGE_BUCKET
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURI(destPath)}`;

      const sizeBytes = file.size || (file.buffer ? file.buffer.length : 0);

      // Save metadata in Firestore
      await createDoc('attachments', {
        article_id: articleId,
        storage_path: destPath,
        public_url: publicUrl,
        filename: originalName,
        mime_type: contentType,
        size_bytes: sizeBytes,
        uploaded_by: userId,
        uploaded_at: new Date()
      }, attachmentId);

      res.status(201).json({
        status: 'success',
        message: 'File uploaded to Firebase Storage',
        data: {
          attachmentId,
          storagePath: destPath,
          filename: originalName,
          size: sizeBytes,
          mime_type: contentType,
          public_url: publicUrl
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
    const userId = req.user!.userId!;
    const { articleId, attachmentId } = req.params;

    const att: any = await getDoc('attachments', attachmentId);
    if (!att || att.article_id !== articleId) {
      res.status(404).json({ status: 'error', message: 'Attachment not found' });
      return;
    }

    // Permission: allow author or privileged roles
    if (att.uploaded_by !== userId && !['admin', 'content_manager', 'editor'].includes(req.user!.role || '')) {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    const storagePath: string = att.storage_path || '';

    try {
      const gcsPath = storagePath.startsWith('gcs/') ? storagePath.slice(4) : storagePath;

      // If already public
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
        const bucketGCS = getStorageBucket();
        const file = bucketGCS.file(gcsPath);
        await file.makePublic();
        const bucketName = (bucketGCS as any).name || process.env.FIREBASE_STORAGE_BUCKET;
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURI(gcsPath)}`;
        // Update DB public_url
        await updateDoc('attachments', attachmentId, { public_url: publicUrl });

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

export const getAttachmentSignedDownloadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const userId = req.user!.userId!;
    const { articleId, attachmentId } = req.params;

    // find attachment
    const att: any = await getDoc('attachments', attachmentId);

    if (!att || att.article_id !== articleId) {
      res.status(404).json({ status: 'error', message: 'Attachment not found' });
      return;
    }

    // permission check
    const allowedPrivileged = ['admin', 'content_manager', 'editor'];
    const isUploader = String(att.uploaded_by) === String(userId);
    const isPrivileged = allowedPrivileged.includes(req.user!.role || '');
    if (!isUploader && !isPrivileged) {
      // allow article author
      const article: any = await getDoc('content', articleId);
      const isAuthor = article && String(article.author_id) === String(userId);
      if (!isAuthor) {
        res.status(403).json({ status: 'error', message: 'Forbidden' });
        return;
      }
    }

    // if public_url exists, return that
    if (att.public_url) {
      res.status(200).json({ status: 'success', data: { url: att.public_url } });
      return;
    }

    const storagePath: string = att.storage_path || '';
    if (!storagePath) {
      res.status(500).json({ status: 'error', message: 'Attachment missing storage reference' });
      return;
    }

    const gcsPath = storagePath.startsWith('gcs/') ? storagePath.slice(4) : storagePath;

    try {
      const readSigned = await getSignedUrl(gcsPath, 'read', READ_SIGNED_URL_EXPIRES_MS);
      const signed = normalizeSignedUrl(readSigned);
      if (!signed) {
        res.status(500).json({ status: 'error', message: 'Could not create signed URL' });
        return;
      }

      res.status(200).json({ status: 'success', data: { url: signed } });
      return;
    } catch (err: any) {
      logger.error('getAttachmentSignedDownloadUrl: failed to create signed URL', err);
      res.status(500).json({ status: 'error', message: 'Failed to create signed URL', error: err?.message || String(err) });
      return;
    }
  } catch (err: any) {
    logger.error('getAttachmentSignedDownloadUrl error', err);
    res.status(500).json({ status: 'error', message: 'Failed to process request', error: err?.message || String(err) });
    return;
  }
};

/**
 * DELETE /api/author/articles/:articleId/attachments/:attachmentId
 */
export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const userId = req.user!.userId!;
    const { articleId, attachmentId } = req.params;

    const att: any = await getDoc('attachments', attachmentId);

    if (!att || att.article_id !== articleId) {
      res.status(404).json({ status: 'error', message: 'Attachment not found' });
      return;
    }

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

    // delete doc
    await deleteDoc('attachments', attachmentId);

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
    const authorId = req.user!.userId!;

    const { status, limit = '50', offset = '0' } = req.query as any;

    // Build query
    let queryQuery: any = getCollection('content')
      .where('author_id', '==', authorId);

    if (status && typeof status === 'string' && status.trim()) {
      const statusArray = status.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (statusArray.length > 0) {
        queryQuery = queryQuery.where('status', 'in', statusArray);
      }
    }

    // Order by updated_at desc
    queryQuery = queryQuery.orderBy('updated_at', 'desc');

    // Pagination
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 50));
    const offsetNum = Math.max(0, parseInt(String(offset), 10) || 0);

    // Note: ensure Firestore index exists for author_id + status + updated_at
    if (offsetNum > 0) {
      queryQuery = queryQuery.offset(offsetNum);
    }
    queryQuery = queryQuery.limit(limitNum);

    const snapshot = await queryQuery.get();

    // Post-process to fetch attachments only if needed or just return null
    // Fetching attachments N+1 is bad
    // We will just return null for attachment_url unless we denormalize it
    // Or we can do a second query for all attachments with these article IDs

    const articleIds = snapshot.docs.map((d: any) => d.id);
    const attachmentsMap: any = {};
    if (articleIds.length > 0) {
      // Fetch one attachment per article? Hard in NoSQL without denormalization 
      // or complex queries.
      // We will skip attachment_url in list view for now or fetch it clumsily if critical.
      // Let's assume frontend can live without it in list, or we fetch it.
      // I will strive for correctness -> try to fetch ONE attachment per article.
      // Actually, let's just query attachments where article_id IN [...]
      // But 'IN' limit is 10.
      // Skipping attachment_url in list for performance unless we denormalize.
      // I will try to fetch for top 10 articles maybe? No, inconsistency is bad.
      // I'll leave attachment_url undefined/null.
    }

    const articles = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      let category = 'General'; // logic from before
      if (data.category_id) category = data.category_id; // we might want to fetch category name?

      return {
        id: doc.id,
        title: data.title || 'Untitled',
        status: data.status || 'draft',
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
        publishedAt: data.created_at?.toDate(),
        views: data.reads_count || 0,
        likes: data.likes_count || 0,
        summary: data.summary,
        category,
        language: data.language,
        // attachment_url: ... // skipped
      };
    });

    res.status(200).json({ status: 'success', message: 'Articles fetched', data: { articles } });
    return;
  } catch (err: any) {
    logger.error('listAuthorArticles error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch articles', error: err?.message });
    return;
  }
};

/**
 * GET /api/author/articles/:articleId
 */
export const getArticleDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const userId = req.user!.userId!;
    const { articleId } = req.params;

    const article: any = await getDoc('content', articleId);
    if (!article) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    const privileged = ['admin', 'content_manager', 'editor', 'reviewer'];
    if (article.author_id !== userId && !privileged.includes(req.user!.role || '')) {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    // Fetch author details
    const authorUser: any = await getDoc('users', article.author_id);
    if (authorUser) {
      article.author_name = authorUser.name;
      article.author_email = authorUser.email;
    }

    // Fetch related
    // Attachments
    const attachments = await executeQuery('attachments', [{ field: 'article_id', op: '==', value: articleId }]);

    // Workflow
    const workflow = await executeQuery('workflow_events', [{ field: 'article_id', op: '==', value: articleId }], 100, { field: 'created_at', dir: 'desc' });

    // Reviews
    const reviews = await executeQuery('reviews', [{ field: 'article_id', op: '==', value: articleId }], 100, { field: 'created_at', dir: 'desc' });

    res.status(200).json({
      status: 'success',
      message: 'Article details fetched',
      data: {
        article: {
          ...article,
          created_at: article.created_at?.toDate ? article.created_at.toDate() : article.created_at,
          updated_at: article.updated_at?.toDate ? article.updated_at.toDate() : article.updated_at
        },
        attachments: attachments.map((a: any) => ({ ...a, uploaded_at: a.uploaded_at?.toDate ? a.uploaded_at.toDate() : a.uploaded_at })),
        workflow: workflow.map((w: any) => ({ ...w, created_at: w.created_at?.toDate ? w.created_at.toDate() : w.created_at })),
        reviews: reviews.map((r: any) => ({ ...r, created_at: r.created_at?.toDate ? r.created_at.toDate() : r.created_at }))
      }
    });
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
    const userId = req.user!.userId!;
    const { articleId } = req.params;
    const { status, note = '' } = req.body;

    if (!status) {
      res.status(400).json({ status: 'error', message: 'Status is required' });
      return;
    }

    const article: any = await getDoc('content', articleId);
    if (!article) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

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

    await updateDoc('content', articleId, { status });

    // Insert workflow event
    await createDoc('workflow_events', {
      article_id: articleId,
      actor_id: userId,
      from_status: article.status,
      to_status: status,
      note,
      created_at: new Date()
    });

    logger.info(`Article ${articleId} status changed from ${article.status} to ${status} by ${userId}`);

    // [NEW] Trigger Certificate Generation if status is published
    if (status === 'published' && article.status !== 'published') {
      try {
        // Lazy load to avoid circular dependency issues if any
        const { createAndSendCertificate } = require('../controllers/certificate.controller');
        createAndSendCertificate(articleId).catch((err: any) => logger.error('Async cert generation failed', err));
      } catch (e) {
        logger.error('Failed to trigger certificate generation', e);
      }
    }

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
    const userId = req.user!.userId!;
    const { articleId } = req.params;

    const article: any = await getDoc('content', articleId);
    if (!article) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    if (article.author_id !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    if (article.status !== 'draft' && req.user!.role !== 'admin') {
      res.status(400).json({ status: 'error', message: 'Only drafts can be deleted by the author' });
      return;
    }

    // Delete attachments from storage and DB
    const attachments = await executeQuery('attachments', [{ field: 'article_id', op: '==', value: articleId }]);
    const bucketGCS = getStorageBucket();

    for (const att of attachments as any[]) {
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
      // Delete attachment doc
      await deleteDoc('attachments', att.id);
    }

    // Delete related docs (Workflow events, Reviews)
    // Firestore doesn't support 'DELETE WHERE', so we must fetch and delete one by one or leave them orphaned.
    // Ideally we fetch and delete.
    const workflowEvents = await executeQuery('workflow_events', [{ field: 'article_id', op: '==', value: articleId }]);
    for (const wf of workflowEvents) await deleteDoc('workflow_events', wf.id);

    const reviews = await executeQuery('reviews', [{ field: 'article_id', op: '==', value: articleId }]);
    for (const r of reviews) await deleteDoc('reviews', r.id);

    // Finally delete article
    await deleteDoc('content', articleId);

    logger.info(`Article ${articleId} deleted by ${userId}`);
    res.status(200).json({ status: 'success', message: 'Article deleted' });
    return;
  } catch (err: any) {
    logger.error('deleteArticle error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete article', error: err?.message });
    return;
  }
};

/* ---------------------------
   TF-IDF Similarity Utilities
   --------------------------- */

function cosineVec(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += (a[i] || 0) * (b[i] || 0);
    na += (a[i] || 0) * (a[i] || 0);
    nb += (b[i] || 0) * (b[i] || 0);
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function extractTextFromBuffer(filename: string, buffer: Buffer): Promise<string> {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  try {
    if (ext === 'pdf') {
      if (!pdfParse) {
        logger.warn('pdf-parse not available, skipping PDF text extraction for', filename);
        return '';
      }
      // pdf-parse accepts Buffer / Uint8Array
      const data = await pdfParse(buffer);
      return data?.text || '';
    }

    if (ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    // For text files (txt, md, html, etc.)
    if (['txt', 'md', 'text', 'rtf', 'html', 'htm'].includes(ext)) {
      return buffer.toString('utf8');
    }

    // For other file types, try to decode as UTF-8
    try {
      return buffer.toString('utf8');
    } catch {
      return '';
    }
  } catch (err) {
    logger.warn(`extractTextFromBuffer failed for ${filename}:`, err);
    return '';
  }
}

/**
 * computeTfidfSimilarities
 * attachments: Array<{ id, filename, buffer }>
 * returns { docs: [{ id, filename, text }], pairs: [{ aId, bId, score }] }
 */
export async function computeTfidfSimilarities(attachments: { id: string; filename: string; buffer: Buffer }[]) {
  // 1) Extract and normalize text
  const docs = [];
  for (const att of attachments) {
    let text = await extractTextFromBuffer(att.filename || att.id, att.buffer);
    // normalize whitespace and trim; cap to reasonable length for TF-IDF
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length > 200000) text = text.slice(0, 200000);
    docs.push({ id: att.id, filename: att.filename || att.id, text });
  }

  // If fewer than 2 docs, nothing to compare
  if (docs.length < 2) {
    return { docs, pairs: [] };
  }

  // 2) Build TF-IDF using natural
  const tfidf = new TfIdf();
  docs.forEach((d) => tfidf.addDocument(d.text));

  // 3) Build vocabulary of top terms across docs (limit to keep vectors manageable)
  const vocabSet = new Set<string>();
  for (let i = 0; i < docs.length; i++) {
    const terms = tfidf.listTerms(i).slice(0, 800); // top terms per doc
    terms.forEach((t: any) => vocabSet.add(t.term));
  }
  const vocab = Array.from(vocabSet);
  const indexOf = new Map<string, number>();
  vocab.forEach((t, i) => indexOf.set(t, i));

  // 4) Build vectors
  const vectors: number[][] = [];
  for (let i = 0; i < docs.length; i++) {
    const vec = new Array(vocab.length).fill(0);
    const terms = tfidf.listTerms(i); // returns {term, tfidf}
    terms.forEach((t: any) => {
      const idx = indexOf.get(t.term);
      if (idx !== undefined) vec[idx] = t.tfidf;
    });
    vectors.push(vec);
  }

  // 5) Pairwise cosine
  const pairs: Array<{ aId: string; bId: string; score: number }> = [];
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const s = cosineVec(vectors[i], vectors[j]);
      pairs.push({ aId: docs[i].id, bId: docs[j].id, score: Number(s.toFixed(4)) });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  return { docs, pairs };
}

// --- Helper Functions for Web Search & Scraping ---

const googleSr = require('google-sr');
const cheerio = require('cheerio');

const performWebSearch = async (query: string): Promise<string[]> => {
  try {
    logger && logger.info && logger.info(`Preforming web search for: ${query}`);
    // Search for organic results
    const searchResults = await googleSr.search({
      query: query,
      limit: 5,
    });

    // Extract URLs
    const urls = searchResults
      .filter((result: any) => result.link && !result.link.includes('youtube.com')) // Filter out non-relevent links
      .map((result: any) => result.link);

    return urls;
  } catch (err) {
    logger && logger.warn && logger.warn('performWebSearch error', err);
    return [];
  }
};

const scrapeWebPage = async (url: string): Promise<string> => {
  try {
    const res = await fetch(url, { timeout: 5000 }); // 5s timeout
    if (!res.ok) return '';
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove script, style, and navigation elements
    $('script, style, nav, header, footer, noscript').remove();

    // Get text
    let text = $('body').text() || '';
    text = text.replace(/\s+/g, ' ').trim();
    return text.slice(0, 10000); // Limit to 10k chars
  } catch (err) {
    if (logger && logger.warn) logger.warn(`Failed to scrape ${url}`, err);
    return '';
  }
};

/**
 * Route handler: POST /api/author/articles/:articleId/similarity
 * - Authenticated
 * - Author or privileged roles OR article author allowed
 * - Downloads attachments (public_url or GCS path) + scrapes web
 * - Runs TF-IDF similarity and returns top pairs
 */
export const runSimilarityCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!requireAuth(req, res)) return;
    const userId = req.user!.userId!;
    const { articleId } = req.params;

    if (!articleId) {
      res.status(400).json({ status: 'error', message: 'articleId required' });
      return;
    }

    // Verify article exists & fetch basic fields + content/title
    const article: any = await getDoc('content', articleId);
    if (!article) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    // Authorization
    const privileged = ['admin', 'content_manager', 'editor'];
    const callerRole = req.user!.role || '';
    const isAuthor = String(article.author_id) === String(userId);
    if (!isAuthor && !privileged.includes(callerRole)) {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    // Fetch attachments
    const attachmentsRows = await executeQuery('attachments', [{ field: 'article_id', op: '==', value: articleId }]);

    // Download attachments
    const bucket = getStorageBucket();
    const attachmentsWithBuffer: Array<{ id: string; filename: string; buffer: Buffer }> = [];

    if (attachmentsRows && attachmentsRows.length > 0) {
      for (const att of attachmentsRows as any[]) {
        try {
          if (att.public_url) {
            const resp = await fetch(att.public_url);
            if (!resp.ok) continue;
            const arrayBuf = await resp.arrayBuffer();
            attachmentsWithBuffer.push({ id: att.id, filename: att.filename || att.id, buffer: Buffer.from(arrayBuf) });
          } else if (att.storage_path) {
            const gcsPath = att.storage_path.startsWith('gcs/') ? att.storage_path.slice(4) : att.storage_path;
            const file = bucket.file(gcsPath);
            const [downBuf] = await file.download();
            attachmentsWithBuffer.push({ id: att.id, filename: att.filename || att.id, buffer: downBuf });
          }
        } catch (e) {
          logger.warn('Failed to download attachment', att.id, e);
        }
      }
    }

    // --- Web Search & Scrape ---
    const includeWeb = true;
    let webDocs: { id: string; filename: string; buffer: Buffer }[] = [];

    if (includeWeb) {
      // Generate query from title or content
      let queryText = article.title || "";
      if (article.content) {
        const plain = article.content.replace(/<[^>]+>/g, " ").slice(0, 300);
        if (!queryText) queryText = plain;
      }

      if (queryText) {
        logger.info(`Running web search for article ${articleId} with query: ${queryText.slice(0, 50)}...`);
        const urls = await performWebSearch(queryText);

        // Concurrent scraping
        const scrapePromises = urls.map(async (url: string) => {
          const text = await scrapeWebPage(url);
          if (text.length > 100) {
            return {
              id: `web-${Buffer.from(url).toString('base64').slice(0, 10)}`,
              filename: url,
              buffer: Buffer.from(text, 'utf-8')
            };
          }
          return null;
        });

        const scraped = await Promise.all(scrapePromises);
        webDocs = scraped.filter((d: any) => d !== null) as any;
      }
    }

    // Combine all docs
    const allDocs = [...attachmentsWithBuffer, ...webDocs];

    // Add main content if available
    if (article.content) {
      allDocs.unshift({
        id: 'main-content',
        filename: 'Article Content',
        buffer: Buffer.from(article.content.replace(/<[^>]+>/g, " "), 'utf-8')
      });
    }

    if (allDocs.length < 2) {
      res.status(200).json({ status: 'success', message: 'No similar content found (no attachments or web results)', data: { docs: [], pairs: [] } });
      return;
    }

    // Run TF-IDF
    const result = await computeTfidfSimilarities(allDocs);

    // Apply filters
    const threshold = typeof req.query.threshold !== 'undefined' ? Number(req.query.threshold) : 0.6;
    const topN = typeof req.query.top !== 'undefined' ? Math.max(1, Math.min(200, Number(req.query.top))) : 20;

    const filteredPairs = result.pairs.filter((p) => p.score >= (isNaN(threshold) ? 0.0 : threshold)).slice(0, topN);

    res.status(200).json({
      status: 'success',
      message: 'Similarity check completed',
      data: {
        docs: result.docs.map((d) => ({ id: d.id, filename: d.filename, textExcerpt: d.text?.slice(0, 200) })),
        pairs: filteredPairs,
        meta: { method: 'tfidf', threshold, topN },
      },
    });
    return;
  } catch (err: any) {
    logger.error('runSimilarityCheck error', err);
    res.status(500).json({ status: 'error', message: 'Similarity check failed', error: err?.message || String(err) });
    return;
  }
};

/* =========================
   Existing JPlag / plumbing
   ========================= */

/* ---------- helper utilities used above ---------- */

// (Helper functions exists, zipFolder, parseJPlagCsv are defined at the bottom of the file)

/**
 * Heuristic AI Content Detection (Aggressively Tuned)
 * Returns { score: number (0-100), details: string[], web_score: number, web_sources: string[] }
 */
function detectAIContent(text: string): { score: number, details: string[], web_score: number, web_sources: string[] } {
  if (!text || text.length < 50) return { score: 0, details: ['Text too short for analysis'], web_score: 0, web_sources: [] };

  const details: string[] = [];
  let score = 0;

  // 1. Phrase Matching (Significantly Expanded for Modern LLMs)
  const aiPhrases = [
    "in conclusion", "it is important to note", "summary of the",
    "delve into", "comprehensive overview", "significant impact",
    "realm of", "landscape of", "it is worth mentioning",
    "cannot be overstated", "plays a crucial role", "fosters a sense of",
    "testament to", "integration of", "leveraging the power of",
    "transformative potential", "paradigm shift", "underscores the importance",
    "aforementioned", "it should be noted", "complex interplay",
    "multifaceted", "nuanced approach", "instrumental in", "pivotal role",
    // New additions
    "rapidly evolving", "ever-changing", "increasingly important",
    "in today's world", "vital aspect", "key component", "fundamental understanding",
    "holistic approach", "synergistic effect", "navigating the complexities",
    "it is essential to", "by and large", "on the other hand", "conversely",
    "furthermore", "moreover", "in addition to", "not only but also",
    "a diverse range of", "wide array of", "plethora of", "myriad of",
    "in the context of", "deep dive", "uncover the nuances",
    "rich tapestry", "vibrant ecosystem", "cornerstone of",
    "beacon of", "testament to the", "harnessing the potential",
    "unlocking the power", "driving force", "game changer",
    "cutting-edge", "state-of-the-art", "seamless integration",
    "robust framework", "dynamic nature", "intricate balance",
    "delicate balance", "double-edged sword", "step in the right direction",
    "pave the way", "dawn of a new era", "uncharted territory",
    "vast potential", "immense possibilities", "stark contrast",
    "notable example", "prime example", "case in point",
    "illuminates the fact", "sheds light on", "brings to the forefront",
    "highlights the need", "emphasizes the importance", "serves as a reminder",
    "testifies to the", "speaks volumes", "bears witness to",
    "stands as a", "remains to be seen", "only time will tell"
  ];

  let phraseHits = 0;
  const lowerText = text.toLowerCase();
  aiPhrases.forEach(p => {
    // Check for whole word match to avoid false positives in substrings
    // Simple regex for word boundary check or include spaces
    if (lowerText.includes(p)) phraseHits++;
  });

  if (phraseHits > 0) {
    // Aggressive: 1 hit = 5 points, but scale non-linearly
    // If > 10 hits, it's very likely AI
    const points = Math.min(70, phraseHits * 6);
    score += points;
    details.push(`Found ${phraseHits} common AI-typical phrases (+${points}%)`);
  }

  // 2. Sentence Length Variance (Stricter & Burstiness)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 5) {
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of Variation

    // Human writing usually has CV > 0.5 (high variance)
    // AI is more uniform, often 0.3 - 0.4
    if (cv < 0.38) {
      score += 40; // Very robotic
      details.push("Extremely low sentence length variance (Robotic structure +40%)");
    } else if (cv < 0.48) {
      score += 25;
      details.push("Low sentence variance (+25%)");
    }
  }

  // 3. Perplexity Proxy (Vocabulary Richness & Repetition)
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  if (words.length > 50) {
    const unique = new Set(words);
    const ttr = unique.size / words.length; // Type-Token Ratio

    // AI tends to reuse "safe" words, but sometimes has high vocabulary if prompted to be complex.
    // However, basic AI writing often has a middle-ground TTR.
    // Let's look for "perfect grammar but lack of soul" - hard to detect with regex.
    // We stick to low TTR as a sign of repetitive (safe) AI writing.
    if (ttr < 0.40 && words.length < 800) {
      score += 25;
      details.push("Low vocabulary diversity (+25%)");
    } else if (ttr < 0.30) {
      score += 40; // Very repetitive
      details.push("Extremely repetitive vocabulary (+40%)");
    }
  }

  // Cap score
  score = Math.min(99, Math.max(0, score));

  if (score < 25) details.push("Likely human-written");
  else if (score > 65) details.push("High probability of AI generation");

  // Removed mocked web score. Web score is now calculated via checkWebSimilarity.

  return { score, details, web_score: 0, web_sources: [] };
}

/* --- Real Web Plagiarism Check Implementation --- */

/**
 * Checks web similarity by searching Google for text segments, scraping top results, 
 * and running TF-IDF comparison.
 */
async function checkWebSimilarity(text: string): Promise<{ score: number, sources: string[] }> {
  if (!text || text.length < 100) return { score: 0, sources: [] };

  // 1. Generate search queries from the text (pick 2-3 significant sentences)
  // Simple strategy: take the first sentence, a middle one, and a random one.
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [];
  const queries: string[] = [];

  if (sentences && sentences.length > 0 && sentences[0]) queries.push(sentences[0].slice(0, 150));
  if (sentences.length > 5) queries.push(sentences[Math.floor(sentences.length / 2)].slice(0, 150));
  if (sentences.length > 10) queries.push(sentences[sentences.length - 2].slice(0, 150));

  // Fallback if no sentences detected
  if (queries.length === 0) queries.push(cleanText.slice(0, 150));

  const allUrls = new Set<string>();

  // Search
  for (const q of queries) {
    try {
      const urls = await performWebSearch(q);
      urls.forEach(u => allUrls.add(u));
    } catch (e) {
      logger.warn('Web search failed for query subset', e);
    }
    // Rate limit kindness
    await new Promise(r => setTimeout(r, 500));
  }

  if (allUrls.size === 0) return { score: 0, sources: [] };

  // Scrape top unique URLs (max 5 to save time/bandwidth)
  const urlsToScrape = Array.from(allUrls).slice(0, 5);
  const scrapedDocs: { id: string, filename: string, text: string }[] = [];

  await Promise.all(urlsToScrape.map(async (url) => {
    const pageText = await scrapeWebPage(url);
    if (pageText && pageText.length > 200) {
      scrapedDocs.push({ id: url, filename: url, text: pageText });
    }
  }));

  if (scrapedDocs.length === 0) return { score: 0, sources: [] };

  // Compare using TF-IDF
  const tfidf = new TfIdf();
  tfidf.addDocument(cleanText); // Doc 0 is our text

  scrapedDocs.forEach((d, i) => {
    tfidf.addDocument(d.text); // Doc i+1
  });

  // Calculate similarity of Doc 0 to each Scraped Doc
  // We can't use the bulk function easily as it does N*N. 
  // Let's manually get vector for Doc 0 and others.

  // Build vocab from Doc 0 only to see how much of IT appears in others? 
  // Or vocab from all. Let's reuse computeTfidfSimilarities logic or simplify.
  // Converting our input text + scraped docs into the format for computeTfidfSimilarities

  const docsForAnalysis = [
    { id: 'input-text', filename: 'Input Text', buffer: Buffer.from(cleanText) },
    ...scrapedDocs.map(d => ({ id: d.id, filename: d.filename, buffer: Buffer.from(d.text) }))
  ];

  const result = await computeTfidfSimilarities(docsForAnalysis);

  // Find max similarity where one side is 'input-text'
  let maxScore = 0;
  const sources: string[] = [];

  result.pairs.forEach(p => {
    if (p.aId === 'input-text' || p.bId === 'input-text') {
      // If the other doc is a scraped url
      const otherId = p.aId === 'input-text' ? p.bId : p.aId;
      if (p.score > maxScore) maxScore = p.score;
      if (p.score > 0.2) { // Threshold for listing as source
        sources.push(`${otherId} (${(p.score * 100).toFixed(0)}%)`);
      }
    }
  });

  // Normalize score to 0-100
  // TF-IDF cosine is 0-1. 
  // scale it: > 0.8 is basically 100% plagiarized.
  let finalScore = Math.min(100, (maxScore / 0.9) * 100);

  return { score: Number(finalScore.toFixed(1)), sources: sources.slice(0, 5) };
}

function uniqueWordsCount(text: string) {
  return new Set(text.toLowerCase().match(/[a-z]+/g) || []).size;
}

/**
 * POST /api/admin/articles/:articleId/plagiarism
 *
 * Runs JPlag (via Docker) + AI Heuristics against attachments.
 * Saves report to storage and metadata to plagiarism_reports.
 */
export const runPlagiarismCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // require authentication middleware to have populated req.user
    if (!req.user || !req.user.userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const { articleId } = req.params;
    if (!articleId) {
      res.status(400).json({ status: 'error', message: 'articleId required' });
      return;
    }

    // Fetch article to verify existence and get author_id AND content
    const article: any = await getDoc('content', articleId);
    if (!article) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    const callerUserId = req.user!.userId!;
    const callerRole = req.user!.role || '';

    // Authorization: allow privileged roles OR the article's author
    const privileged = ['admin', 'content_manager', 'editor', 'partner', 'author'];
    const isAuthor = String(article.author_id) === String(callerUserId);
    if (!privileged.includes(callerRole) && !isAuthor) {
      res.status(403).json({ status: 'error', message: 'Forbidden' });
      return;
    }

    // Fetch attachments for the article
    const attachments = await executeQuery('attachments', [{ field: 'article_id', op: '==', value: articleId }]);

    // If NO attachments AND NO content, then error
    const hasContent = article.content && typeof article.content === 'string' && article.content.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    if (!hasAttachments && !hasContent) {
      res.status(400).json({ status: 'error', message: 'No content or attachments found to run checks on' });
      return;
    }

    // Create temp working dir
    const workRoot = await fs.mkdtemp(path.join(os.tmpdir(), `jplag-${articleId}-`));
    const submissionsDir = path.join(workRoot, 'submissions');
    await fs.mkdir(submissionsDir);

    // Download attachments
    const bucket = getStorageBucket();
    let combinedTextForAI = ""; // Collect text for AI detection

    // 1. ADD ARTICLE CONTENT TO ANALYSIS
    if (hasContent) {
      const plainContent = article.content.replace(/<[^>]+>/g, ' '); // simple strip HTML
      combinedTextForAI += plainContent + "\n\n";

      // Save content as a file for JPlag (treat content as a "submission")
      const contentPath = path.join(submissionsDir, `article_content_${articleId}.txt`);
      await fs.writeFile(contentPath, plainContent, 'utf8');
    }

    if (hasAttachments) {
      for (const att of attachments as any[]) {
        const fname = att.filename || att.id;
        const localPath = path.join(submissionsDir, `${att.id}-${fname}`);

        let buffer: Buffer | null = null;

        try {
          if (att.public_url) {
            const resp = await fetch(att.public_url);
            if (resp.ok) {
              buffer = Buffer.from(await resp.arrayBuffer());
            }
          } else if (att.storage_path) {
            const gcsPath = att.storage_path.startsWith('gcs/') ? att.storage_path.slice(4) : att.storage_path;
            const file = bucket.file(gcsPath);
            const [downBuf] = await file.download();
            buffer = downBuf;
          }
        } catch (downloadErr) {
          logger.warn(`Failed to download attachment ${att.id}`, downloadErr);
        }

        if (buffer) {
          // write to file for JPlag
          await fs.writeFile(localPath, buffer);

          // extract text for AI
          try {
            const extracted = await extractTextFromBuffer(fname, buffer);
            combinedTextForAI += (extracted + "\n");
          } catch (extractErr) {
            logger.warn(`Failed to extract text from ${fname}`, extractErr);
          }
        }
      }
    }

    // --- AI Detection Step ---
    const aiResult = detectAIContent(combinedTextForAI);

    // --- Real Web Plagiarism Check ---
    let webCheckResult = { score: 0, sources: [] as string[] };
    try {
      if (combinedTextForAI && combinedTextForAI.length > 100) {
        webCheckResult = await checkWebSimilarity(combinedTextForAI);
      }
    } catch (e) {
      logger.warn('Real web check failed', e);
    }
    // ------------------------------------

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

    // Run JPlag (allow failure if image missing, but try)
    let jplagSuccess = false;
    try {
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
      jplagSuccess = true;
    } catch (dockerErr) {
      logger.warn("JPlag Docker failed (maybe not installed?), proceeding with just AI score if possible", dockerErr);
    }

    // Locate JPlag report
    let reportPath: string | null = null;
    if (jplagSuccess) {
      const possibleOut = ['out', 'report', 'jplag-out', 'results'].map(n => path.join(workRoot, n));
      for (const p of possibleOut) {
        try {
          const stat = await fs.stat(p);
          if (stat && stat.isDirectory()) {
            reportPath = p;
            break;
          }
        } catch (e) { }
      }
      if (!reportPath) reportPath = workRoot;
    }

    // Zip the report if exists
    let storagePath: string | null = null;
    let signedUrl: string | null = null;

    if (jplagSuccess && reportPath) {
      const reportZipPath = path.join(workRoot, 'jplag-report.zip');
      await zipFolder(reportPath, reportZipPath);

      // Upload zip to storage
      const reportId = uuidv4();
      storagePath = `plagiarism_reports/${articleId}/${reportId}.zip`;
      const file = bucket.file(storagePath);
      await file.save(await fs.readFile(reportZipPath), {
        metadata: { contentType: 'application/zip' },
        resumable: false,
      });

      // Create signed URL (7 days)
      const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      signedUrl = url;
    }

    // Parse CSV if available
    let similaritySummary: any = {};
    if (jplagSuccess && reportPath) {
      try {
        const csvPath = path.join(reportPath, 'report.csv');
        const csvExists = await exists(csvPath);
        if (csvExists) {
          const csv = await fs.readFile(csvPath, 'utf8');
          similaritySummary = parseJPlagCsv(csv);
        } else {
          similaritySummary = { notice: 'no-csv-found' };
        }
      } catch (e) {
        logger.warn('Failed to parse jplag csv', e);
      }
    } else {
      similaritySummary = { notice: 'jplag-failed-or-skipped' };
    }

    // --- Inject AI & Web Stats into Summary ---
    similaritySummary.ai_score = aiResult.score;
    similaritySummary.ai_details = aiResult.details;
    similaritySummary.web_score = webCheckResult.score;
    similaritySummary.web_sources = webCheckResult.sources;
    // ------------------------------------

    const reportId = uuidv4();

    // Persist report metadata in Firestore
    await createDoc('plagiarism_reports', {
      article_id: articleId,
      run_by: req.user!.userId || null,
      similarity_summary: similaritySummary,
      report_storage_path: storagePath,
      report_public_url: signedUrl,
      status: 'completed',
      created_at: new Date()
    }, reportId);

    // cleanup temp
    try {
      await fs.rm(workRoot, { recursive: true, force: true });
    } catch { }

    res.status(201).json({
      status: 'success',
      message: 'Plagiarism & AI check completed',
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
    const archive = archiver('zip', { zlib: { level: 9 } });
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

// --- Missing Exports Implementation ---




