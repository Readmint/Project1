// reader.controller.ts
import { Request, Response } from 'express';
import admin from 'firebase-admin';
import { getMySQLDatabase, getFirestoreDatabase } from '../config/database'; // adjust path if needed
import { logger } from '../utils/logger';

const mysqlDb = getMySQLDatabase();
let firestoreDb: any;
try {
  firestoreDb = getFirestoreDatabase();
} catch (err) {
  // Firestore might be optional in some environments
  firestoreDb = null;
}

/**
 * GET /reader/home
 * Returns featured, trending, and recent content (basic implementation)
 */
export const getReaderHome = async (req: Request, res: Response) => {
  try {
    // simple: fetch featured + top trending items
    const [featured]: any = await mysqlDb.execute(
      `SELECT id, title, metadata, featured, reads_count, likes_count, created_at
       FROM content
       WHERE featured = TRUE
       ORDER BY created_at DESC
       LIMIT 10`
    );

    const [trending]: any = await mysqlDb.execute(
      `SELECT id, title, metadata, featured, reads_count, likes_count, created_at
       FROM content
       WHERE status = 'published'
       ORDER BY trending_score DESC, reads_count DESC
       LIMIT 20`
    );

    const [recent]: any = await mysqlDb.execute(
      `SELECT id, title, metadata, featured, reads_count, likes_count, created_at
       FROM content
       WHERE status = 'published'
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return res.json({
      featured: featured[0] ? featured : [],
      trending: trending[0] ? trending : [],
      recent: recent[0] ? recent : []
    });
  } catch (error) {
    logger.error('Error in getReaderHome', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /content/:contentId
 * Returns content metadata, checks premium flag and subscription if user present
 */
export const getContentById = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const uid = (req as any).user?.uid || null; // if you have auth middleware that sets req.user

    const [rows]: any = await mysqlDb.execute(
      `SELECT id, title, author_id, category_id, metadata, featured, reads_count, likes_count, status
       FROM content WHERE id = ? LIMIT 1`,
      [contentId]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const content = rows[0];

    // If content is premium and you want to check subscription:
    const isPremium = content.metadata && content.metadata.isPremium;
    if (isPremium && uid) {
      // Check user's subscription status in user_subscriptions
      const [userSubs]: any = await mysqlDb.execute(
        `SELECT status, end_date FROM user_subscriptions WHERE user_id = ? AND status = 'active' ORDER BY end_date DESC LIMIT 1`,
        [ (req as any).user?.id || null ]
      );
      // If no active subscription, mark restricted
      if (!userSubs[0]) {
        content.access = 'restricted';
      } else {
        content.access = 'granted';
      }
    } else if (isPremium && !uid) {
      content.access = 'restricted';
    } else {
      content.access = 'granted';
    }

    return res.json({ content });
  } catch (error) {
    logger.error('Error in getContentById', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /content/:contentId/stream
 * Returns a signed URL to storage (uses firebase admin storage)
 * Assumes content.metadata.storage_path contains the path
 */
export const getContentStream = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    const [rows]: any = await mysqlDb.execute(
      `SELECT id, title, metadata FROM content WHERE id = ? LIMIT 1`,
      [contentId]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const content = rows[0];
    const storagePath = content.metadata?.storage_path || content.metadata?.filePath;

    if (!storagePath) {
      return res.status(400).json({ message: 'No storage path available for this content' });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ message: 'Storage not configured' });
    }

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || admin.storage().bucket().name;
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(storagePath);

    // Signed URL valid for short time (e.g., 5 minutes)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    return res.json({ url });
  } catch (error) {
    logger.error('Error in getContentStream', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /users/:userId/progress
 * Save or update reading progress (upsert)
 */
export const postReadingProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { contentId, lastReadPosition, percentRead } = req.body;

    if (!userId || !contentId) {
      return res.status(400).json({ message: 'userId and contentId are required' });
    }

    // Upsert (insert or update)
    await mysqlDb.execute(
      `INSERT INTO reading_progress (id, user_id, content_id, last_read_position, percent_read, last_opened_at, created_at, updated_at)
       VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         last_read_position = VALUES(last_read_position),
         percent_read = VALUES(percent_read),
         last_opened_at = NOW(),
         updated_at = NOW()`,
      [userId, contentId, lastReadPosition || null, percentRead || 0]
    );

    return res.json({ message: 'Progress saved' });
  } catch (error) {
    logger.error('Error in postReadingProgress', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /users/:userId/progress
 * Get recent progress for a user
 */
export const getReadingProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const [rows]: any = await mysqlDb.execute(
      `SELECT user_id, content_id, last_read_position, percent_read, last_opened_at
       FROM reading_progress
       WHERE user_id = ?
       ORDER BY last_opened_at DESC
       LIMIT 50`,
      [userId]
    );

    return res.json({ progress: rows[0] ? rows : [] });
  } catch (error) {
    logger.error('Error in getReadingProgress', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /users/:userId/bookmark
 * Toggle bookmark: body -> { contentId }
 */
export const toggleBookmark = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { contentId } = req.body;

    if (!userId || !contentId) {
      return res.status(400).json({ message: 'userId and contentId are required' });
    }

    // Check if exists
    const [existing]: any = await mysqlDb.execute(
      `SELECT id FROM user_bookmarks WHERE user_id = ? AND content_id = ? LIMIT 1`,
      [userId, contentId]
    );

    if (existing[0]) {
      // remove
      await mysqlDb.execute(`DELETE FROM user_bookmarks WHERE id = ?`, [existing[0].id]);
      // decrement saved_items_count safely
      await mysqlDb.execute(
        `UPDATE readers SET saved_items_count = GREATEST(0, saved_items_count - 1) WHERE user_id = ?`,
        [userId]
      );
      return res.json({ message: 'Bookmark removed', removed: true });
    } else {
      // insert
      await mysqlDb.execute(
        `INSERT INTO user_bookmarks (id, user_id, content_id, saved_at) VALUES (UUID(), ?, ?, NOW())`,
        [userId, contentId]
      );
      await mysqlDb.execute(
        `UPDATE readers SET saved_items_count = COALESCE(saved_items_count,0) + 1 WHERE user_id = ?`,
        [userId]
      );
      return res.json({ message: 'Bookmark added', added: true });
    }
  } catch (error) {
    logger.error('Error in toggleBookmark', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /users/:userId/like
 * Toggle like: body -> { contentId }
 */
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { contentId } = req.body;

    if (!userId || !contentId) {
      return res.status(400).json({ message: 'userId and contentId are required' });
    }

    const [existing]: any = await mysqlDb.execute(
      `SELECT id FROM user_likes WHERE user_id = ? AND content_id = ? LIMIT 1`,
      [userId, contentId]
    );

    if (existing[0]) {
      // remove like
      await mysqlDb.execute(`DELETE FROM user_likes WHERE id = ?`, [existing[0].id]);
      // decrement counters
      await mysqlDb.execute(
        `UPDATE content SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?`,
        [contentId]
      );
      await mysqlDb.execute(
        `UPDATE readers SET likes_count = GREATEST(0, likes_count - 1) WHERE user_id = ?`,
        [userId]
      );
      return res.json({ message: 'Like removed', removed: true });
    } else {
      // add like
      await mysqlDb.execute(
        `INSERT INTO user_likes (id, user_id, content_id, liked_at) VALUES (UUID(), ?, ?, NOW())`,
        [userId, contentId]
      );
      await mysqlDb.execute(
        `UPDATE content SET likes_count = COALESCE(likes_count,0) + 1 WHERE id = ?`,
        [contentId]
      );
      await mysqlDb.execute(
        `UPDATE readers SET likes_count = COALESCE(likes_count,0) + 1 WHERE user_id = ?`,
        [userId]
      );
      return res.json({ message: 'Like added', added: true });
    }
  } catch (error) {
    logger.error('Error in toggleLike', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /recommendations/:userId
 * Simple recommendations: use recommendations table if present, fallback to trending
 */
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [recRows]: any = await mysqlDb.execute(
      `SELECT items, algorithm_version, generated_at FROM recommendations WHERE user_id = ? ORDER BY generated_at DESC LIMIT 1`,
      [userId]
    );

    if (recRows[0] && recRows[0].items) {
      return res.json({ recommendations: recRows[0].items, algorithm_version: recRows[0].algorithm_version });
    }

    // Fallback: top trending
    const [trending]: any = await mysqlDb.execute(
      `SELECT id, title, metadata, reads_count, likes_count FROM content WHERE status = 'published' ORDER BY trending_score DESC, reads_count DESC LIMIT 20`
    );

    return res.json({ recommendations: trending[0] ? trending : [] });
  } catch (error) {
    logger.error('Error in getRecommendations', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
