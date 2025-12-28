
import { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { getStorageBucket, getSignedUrl } from '../utils/storage';
import { incrementViews } from './author.controller';

export const getPublishedArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const db: any = getDatabase();
    const userId = (req as any).user?.userId;

    // Get Reader's partner_id
    let readerPartnerId = null;
    if (userId) {
      const [uRows]: any = await db.execute('SELECT partner_id FROM users WHERE id = ?', [userId]);
      readerPartnerId = uRows[0]?.partner_id || null;
    }

    // Dynamic Query based on Reader's Partner
    let query = `
            SELECT 
                c.id, c.title, c.content, c.price, c.is_free, c.published_at, 
                c.category_id, cat.name as category_name, u.name as author_name,
                c.visibility,
                (SELECT COUNT(*) FROM attachments WHERE article_id = c.id) as attachment_count
            FROM content c
            JOIN users u ON c.author_id = u.id
            LEFT JOIN categories cat ON c.category_id = cat.category_id
            WHERE c.status = 'published'
    `;

    const params: any[] = [];

    if (readerPartnerId) {
      // Reader is part of a Partner Organization
      // Show: Public content + Partner content (if author is in same partner)
      // Ensure that visibility is either public OR (partner AND author.partner_id matches)
      // Also handling 'private' which shouldn't be here typically, but let's exclude it implicitly by not selecting it.
      query += ` AND (c.visibility = 'public' OR (c.visibility = 'partner' AND u.partner_id = ?))`;
      params.push(readerPartnerId);
    } else {
      // General Reader (Public only)
      query += ` AND c.visibility = 'public'`;
    }

    query += ` ORDER BY c.published_at DESC`;

    const [rows]: any = await db.execute(query, params);

    // Check user purchases if logged in
    // Check user interactions if logged in
    let purchasedIds = new Set();
    let bookmarkedIds = new Set();

    if (userId) {
      const [purchases]: any = await db.execute(
        'SELECT article_id FROM user_purchases WHERE user_id = ?',
        [userId]
      );
      purchases.forEach((p: any) => purchasedIds.add(p.article_id));

      const [bookmarks]: any = await db.execute(
        'SELECT article_id FROM user_bookmarks WHERE user_id = ?',
        [userId]
      );
      bookmarks.forEach((b: any) => bookmarkedIds.add(b.article_id));
    }

    const data = rows.map((row: any) => {
      // Create plain text synopsis from HTML content
      const plainText = row.content ? row.content.replace(/<[^>]*>?/gm, '') : '';
      const synopsis = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');

      // Remove full content before sending list to reduce payload
      const { content, ...rest } = row;

      return {
        ...rest,
        synopsis,
        is_purchased: row.is_free ? true : purchasedIds.has(row.id),
        is_bookmarked: bookmarkedIds.has(row.id)
      };
    });

    res.status(200).json({ status: 'success', data });
  } catch (error: any) {
    console.error('Get published articles error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch articles', error: error.message });
  }
};

export const getMyLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const db: any = getDatabase();

    const [rows]: any = await db.execute(`
            SELECT 
                c.id, c.title, c.content, c.published_at, 
                u.name as author_name, up.purchased_at
            FROM user_purchases up
            JOIN content c ON up.article_id = c.id
            JOIN users u ON c.author_id = u.id
            WHERE up.user_id = ?
            ORDER BY up.purchased_at DESC
        `, [userId]);

    const data = rows.map((row: any) => {
      const plainText = row.content ? row.content.replace(/<[^>]*>?/gm, '') : '';
      const synopsis = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
      const { content, ...rest } = row;
      return { ...rest, synopsis };
    });

    res.status(200).json({ status: 'success', data });
  } catch (error: any) {
    console.error('Get library error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch library' });
  }
};

export const getArticleDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const db: any = getDatabase();

    // 1. Fetch Article Metadata
    const [articles]: any = await db.execute(`
            SELECT 
                c.id, c.title, c.content, c.price, c.is_free, c.published_at, 
                c.category_id, cat.name as category_name, u.name as author_name
            FROM content c
            JOIN users u ON c.author_id = u.id
            LEFT JOIN categories cat ON c.category_id = cat.category_id
            WHERE c.id = ? AND c.status = 'published'
        `, [id]);

    if (articles.length === 0) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    const article = articles[0];

    // 2. Check Access
    let hasAccess = article.is_free === 1;
    if (!hasAccess && userId) {
      const [purchase]: any = await db.execute(
        'SELECT 1 FROM user_purchases WHERE user_id = ? AND article_id = ?',
        [userId, id]
      );
      if (purchase.length > 0) hasAccess = true;
    }

    // 3. Fetch Social Stats (Likes & Comments)
    const [likes]: any = await db.execute(
      'SELECT COUNT(*) as count FROM user_likes WHERE article_id = ?', [id]
    );

    let isLiked = false;
    if (userId) {
      const [userLike]: any = await db.execute(
        'SELECT 1 FROM user_likes WHERE user_id = ? AND article_id = ?',
        [userId, id]
      );
      isLiked = userLike.length > 0;
    }

    const [comments]: any = await db.execute(`
            SELECT ac.id, ac.content, ac.created_at, u.name as user_name
            FROM article_comments ac
            JOIN users u ON ac.user_id = u.id
            WHERE ac.article_id = ?
            ORDER BY ac.created_at DESC
        `, [id]);

    // 4. Check Bookmark
    let isBookmarked = false;
    if (userId) {
      const [bm]: any = await db.execute(
        'SELECT 1 FROM user_bookmarks WHERE user_id = ? AND article_id = ?',
        [userId, id]
      );
      isBookmarked = bm.length > 0;
    }

    // 5. Increment View Count (Async)
    // We increment if the user has access (read the article) OR even if they just view the page?
    // Usually "read" counts when they have access.
    // Spec: "view count below these views should be stored and shown in the view of the respective author part"
    if (hasAccess) {
      incrementViews(article.author_id, 1).catch(err => console.error("Failed to increment views", err));
      // Also update local content read count?
      // db.execute('UPDATE content SET reads_count = reads_count + 1 WHERE id = ?', [id]).catch();
    }

    // 4. Prepare Response
    const plainText = article.content ? article.content.replace(/<[^>]*>?/gm, '') : '';
    const synopsis = plainText.substring(0, 200) + '...';

    let attachments = [];
    if (hasAccess) {
      const [atts]: any = await db.execute('SELECT id, filename, storage_path FROM attachments WHERE article_id = ?', [id]);
      // Generate signed URLs (mock for now, similar to previous reviewer implementation)
      // const { getSignedUrl } = require('../utils/storage'); // Already imported at the top
      attachments = await Promise.all(atts.map(async (att: any) => {
        let public_url = att.storage_path.startsWith('http') ? att.storage_path : null;
        if (!public_url) {
          try {
            public_url = await getSignedUrl(att.storage_path);
          } catch (e) {
            public_url = null; // Fallback handled in UI
          }
        }
        return {
          id: att.id,
          filename: att.filename,
          public_url,
          storage_path: att.storage_path
        };
      }));
    }

    res.status(200).json({
      status: 'success',
      data: {
        ...article,
        content: hasAccess ? article.content : null, // Hide content if locked
        synopsis,
        has_access: hasAccess,
        is_bookmarked: isBookmarked,
        attachments,
        social: {
          likes: likes[0].count,
          is_liked: isLiked,
          comments
        }
      }
    });

  } catch (error: any) {
    console.error('Get article details error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch article' });
  }
};

export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const db: any = getDatabase();

    // Check if already liked
    const [existing]: any = await db.execute(
      'SELECT * FROM user_likes WHERE user_id = ? AND article_id = ?',
      [userId, id]
    );

    if (existing.length > 0) {
      // Unlike
      await db.execute('DELETE FROM user_likes WHERE user_id = ? AND article_id = ?', [userId, id]);
      res.status(200).json({ status: 'success', liked: false });
    } else {
      // Like
      await db.execute('INSERT INTO user_likes (user_id, article_id) VALUES (?, ?)', [userId, id]);
      res.status(200).json({ status: 'success', liked: true });
    }
  } catch (error: any) {
    console.error('Toggle like error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to toggle like' });
  }
};

export const postComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.userId;

    if (!content || !content.trim()) {
      res.status(400).json({ status: 'error', message: 'Comment content is required' });
      return;
    }

    const db: any = getDatabase();
    await db.execute(
      'INSERT INTO article_comments (id, article_id, user_id, content) VALUES (UUID(), ?, ?, ?)',
      [id, userId, content]
    );

    res.status(201).json({ status: 'success', message: 'Comment posted' });
  } catch (error: any) {
    console.error('Post comment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to post comment' });
  }
};

export const getReaderPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const db: any = getDatabase();
    // Assuming 'type' column exists or we just return all. 
    // Checking schema: subscription_plans(id, name, description, price_monthly, price_yearly, features, created_at, updated_at).
    // No type column. We just return all plans.
    const [plans]: any = await db.execute('SELECT * FROM subscription_plans');

    // Parse features JSON
    const data = plans.map((p: any) => ({
      ...p,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
    }));

    res.status(200).json({ status: 'success', data });
  } catch (error: any) {
    console.error('Get plans error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch plans' });
  }
};

export const getBookmarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const db: any = getDatabase();

    const [rows]: any = await db.execute(`
            SELECT 
                c.id, c.title, c.content, c.published_at, u.name as author_name,
                c.price, c.is_free
            FROM user_bookmarks ub
            JOIN content c ON ub.article_id = c.id
            JOIN users u ON c.author_id = u.id
            WHERE ub.user_id = ?
            ORDER BY ub.created_at DESC
    `, [userId]);

    const data = rows.map((row: any) => {
      const plainText = row.content ? row.content.replace(/<[^>]*>?/gm, '') : '';
      const synopsis = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
      const { content, ...rest } = row;
      return { ...rest, synopsis, is_bookmarked: true };
    });

    res.status(200).json({ status: 'success', data });
  } catch (error: any) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch bookmarks' });
  }
};

export const toggleBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // article_id
    const userId = (req as any).user?.userId;
    const db: any = getDatabase();

    // Check if exists
    const [existing]: any = await db.execute(
      'SELECT 1 FROM user_bookmarks WHERE user_id = ? AND article_id = ?',
      [userId, id]
    );

    if (existing.length > 0) {
      // Remove
      await db.execute('DELETE FROM user_bookmarks WHERE user_id = ? AND article_id = ?', [userId, id]);
      res.status(200).json({ status: 'success', bookmarked: false, message: 'Removed from bookmarks' });
    } else {
      // Add
      // Check if article exists first? optional but good practice.
      await db.execute('INSERT INTO user_bookmarks (user_id, article_id) VALUES (?, ?)', [userId, id]);
      res.status(200).json({ status: 'success', bookmarked: true, message: 'Added to bookmarks' });
    }
  } catch (error: any) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to toggle bookmark' });
  }
};
