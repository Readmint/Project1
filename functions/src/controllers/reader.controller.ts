
import { Request, Response } from 'express';
// import { getDatabase } from '../config/database'; 
import { getStorageBucket, getSignedUrl } from '../utils/storage';
import { incrementViews } from './author.controller';
import { executeQuery, getDoc, createDoc, updateDoc, deleteDoc, getCollection } from '../utils/firestore-helpers';

export const getPublishedArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    // Get Reader's partner_id
    let readerPartnerId = null;
    if (userId) {
      const u: any = await getDoc('users', userId);
      readerPartnerId = u?.partner_id || null;
    }

    // Fetch all published articles
    // Firestore composite index might be needed for status + published_at order
    const articles = await executeQuery('content', [
      { field: 'status', op: '==', value: 'published' }
      // { field: 'visibility', op: '==', value: 'public' } -- OR partner. We filter in memory for complex OR Logic or use multiple queries.
    ]); // Order by published_at DESC ?? helper supports it

    // Filter by visibility in memory
    const visibleArticles = articles.filter((c: any) => {
      if (c.visibility === 'public') return true;
      if (c.visibility === 'partner' && readerPartnerId && c.author_id) {
        // Need author's partner_id.
        // This implies we need to fetch author details for every partner article.
        // Optimization: We will fetch author details later anyway.
        return true; // Tentatively include, verify later? 
        // Actually SQL did: (c.visibility = 'partner' AND u.partner_id = ?) joined on author.
        // So we need author info.
      }
      return false;
    }).sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    // Check user purchases/bookmarks if logged in
    const purchasedIds = new Set();
    const bookmarkedIds = new Set();

    if (userId) {
      const purchases = await executeQuery('user_purchases', [{ field: 'user_id', op: '==', value: userId }]);
      purchases.forEach((p: any) => purchasedIds.add(p.article_id));

      const bookmarks = await executeQuery('user_bookmarks', [{ field: 'user_id', op: '==', value: userId }]);
      bookmarks.forEach((b: any) => bookmarkedIds.add(b.article_id));
    }

    // Enhance Process
    const data = await Promise.all(visibleArticles.map(async (article: any) => {
      // Author Info
      let author_name = 'Unknown Author';
      let author_partner_id = null;
      if (article.author_id) {
        const u: any = await getDoc('users', article.author_id);
        if (u) {
          author_name = u.name || u.email || 'Unknown';
          author_partner_id = u.partner_id;
        }
      }

      // Final Visibility Check for 'partner'
      if (article.visibility === 'partner') {
        if (readerPartnerId && author_partner_id && readerPartnerId === author_partner_id) {
          // ok
        } else {
          return null; // Exclude
        }
      }

      // Category Name
      let category_name = null;
      if (article.category_id) {
        // Check if it's an ID or name. If ID, fetch.
        // Assuming simplified: if it looks like UUID, fetch.
        const cat: any = await getDoc('categories', article.category_id);
        if (cat) category_name = cat.name;
        else category_name = article.category_id; // Fallback if it was stored as name or not found
      }

      // Attachment count
      const atts = await executeQuery('attachments', [{ field: 'article_id', op: '==', value: article.id }]);
      const attachment_count = atts.length;

      // Synopsis
      const plainText = article.content ? article.content.replace(/<[^>]*>?/gm, '') : '';
      const synopsis = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');

      const { content, ...rest } = article;

      return {
        ...rest,
        category_name,
        author_name,
        attachment_count,
        synopsis,
        is_purchased: article.is_free ? true : purchasedIds.has(article.id),
        is_bookmarked: bookmarkedIds.has(article.id)
      };
    }));

    const finalData = data.filter(d => d !== null);

    res.status(200).json({ status: 'success', data: finalData });
  } catch (error: any) {
    console.error('Get published articles error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch articles', error: error.message });
  }
};

export const getMyLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const purchases = await executeQuery('user_purchases', [{ field: 'user_id', op: '==', value: userId }]);
    // Sort logic handled in memory or query if updated_at exists on purchase
    purchases.sort((a: any, b: any) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime());

    const data = await Promise.all(purchases.map(async (p: any) => {
      const article: any = await getDoc('content', p.article_id);
      if (!article) return null;

      // Author
      let author_name = 'Unknown';
      if (article.author_id) {
        const u: any = await getDoc('users', article.author_id);
        if (u) author_name = u.name || u.email || 'Unknown';
      }

      const plainText = article.content ? article.content.replace(/<[^>]*>?/gm, '') : '';
      const synopsis = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
      const { content, ...rest } = article;

      return {
        ...rest,
        synopsis,
        author_name,
        purchased_at: p.purchased_at
      };
    }));

    res.status(200).json({ status: 'success', data: data.filter(d => d !== null) });
  } catch (error: any) {
    console.error('Get library error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch library' });
  }
};

export const getArticleDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    // 1. Fetch Article Metadata
    const article: any = await getDoc('content', id);
    if (!article || article.status !== 'published') {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    // Attach Category Name
    let category_name = null;
    if (article.category_id) {
      const cat: any = await getDoc('categories', article.category_id);
      if (cat) category_name = cat.name;
      else category_name = article.category_id;
    }
    article.category_name = category_name;

    // Attach Author Name
    let author_name = 'Unknown Author';
    if (article.author_id) {
      const u: any = await getDoc('users', article.author_id);
      if (u) author_name = u.name || u.email || 'Unknown';
    }
    article.author_name = author_name;

    // 2. Check Access
    let hasAccess = article.is_free === 1 || article.is_free === true; // Handle 1 or true
    if (!hasAccess && userId) {
      const purchases = await executeQuery('user_purchases', [
        { field: 'user_id', op: '==', value: userId },
        { field: 'article_id', op: '==', value: id }
      ]);
      if (purchases.length > 0) hasAccess = true;
    }

    // 3. Fetch Social Stats (Likes & Comments)
    // Likes Count
    // Firestore count.
    const likesList = await executeQuery('user_likes', [{ field: 'article_id', op: '==', value: id }]);
    const likeCount = likesList.length;

    let isLiked = false;
    if (userId) {
      const userLike = await executeQuery('user_likes', [
        { field: 'user_id', op: '==', value: userId },
        { field: 'article_id', op: '==', value: id }
      ]);
      isLiked = userLike.length > 0;
    }

    // Comments
    const commentsList = await executeQuery('article_comments', [{ field: 'article_id', op: '==', value: id }]);
    // Sort desc
    commentsList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Join User Names for Comments
    const comments = await Promise.all(commentsList.map(async (c: any) => {
      let user_name = 'Unknown';
      if (c.user_id) {
        const u: any = await getDoc('users', c.user_id);
        if (u) user_name = u.name || u.email || 'Unknown';
      }
      return {
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_name
      };
    }));

    // 4. Check Bookmark
    let isBookmarked = false;
    if (userId) {
      const bm = await executeQuery('user_bookmarks', [
        { field: 'user_id', op: '==', value: userId },
        { field: 'article_id', op: '==', value: id }
      ]);
      isBookmarked = bm.length > 0;
    }

    // 5. Increment View Count (Async)
    if (hasAccess) {
      incrementViews(article.author_id, 1).catch(err => console.error("Failed to increment views", err));
      // Also update local content read count?
      // Firestore increment support via helper or direct update.
      // For now, simpler to just start async.
      // await updateDoc('content', id, { reads_count: (article.reads_count || 0) + 1 });
    }

    // 4. Prepare Response
    const plainText = article.content ? article.content.replace(/<[^>]*>?/gm, '') : '';
    const synopsis = plainText.substring(0, 200) + '...';

    let attachments: any[] = [];
    if (hasAccess) {
      const atts = await executeQuery('attachments', [{ field: 'article_id', op: '==', value: id }]);
      attachments = await Promise.all(atts.map(async (att: any) => {
        let public_url = att.public_url || null;
        if (!public_url && att.storage_path) {
          const gcsPath = att.storage_path.startsWith('gcs/') ? att.storage_path.slice(4) : att.storage_path;
          try {
            public_url = await getSignedUrl(gcsPath);
          } catch (e) { public_url = null; }
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
        design_data: hasAccess && article.design_data ? (typeof article.design_data === 'string' ? JSON.parse(article.design_data) : article.design_data) : null,
        social: {
          likes: likeCount,
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

    // Check if already liked
    const existing = await executeQuery('user_likes', [
      { field: 'user_id', op: '==', value: userId },
      { field: 'article_id', op: '==', value: id }
    ]);

    if (existing.length > 0) {
      // Unlike
      await deleteDoc('user_likes', existing[0].id);
      res.status(200).json({ status: 'success', liked: false });
    } else {
      // Like
      await createDoc('user_likes', {
        user_id: userId,
        article_id: id,
        created_at: new Date()
      });
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

    await createDoc('article_comments', {
      article_id: id,
      user_id: userId,
      content: content,
      created_at: new Date()
    });

    res.status(201).json({ status: 'success', message: 'Comment posted' });
  } catch (error: any) {
    console.error('Post comment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to post comment' });
  }
};

export const getReaderPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await executeQuery('subscription_plans', []);
    // Parse features JSON (if using Firestores native array, it's array. If string, parse).
    // Firestore usually stores arrays if we saved as array. If we saved string, parse.
    const data = plans.map((p: any) => ({
      ...p,
      features: (typeof p.features === 'string') ? JSON.parse(p.features) : (p.features || [])
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
    if (!userId) { // Should be guarded by route but checking for safety
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const bookmarks = await executeQuery('user_bookmarks', [{ field: 'user_id', op: '==', value: userId }]);
    bookmarks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const data = await Promise.all(bookmarks.map(async (bm: any) => {
      const c: any = await getDoc('content', bm.article_id);
      if (!c) return null;

      let author_name = 'Unknown';
      if (c.author_id) {
        const u: any = await getDoc('users', c.author_id);
        if (u) author_name = u.name || u.email || 'Unknown';
      }

      const plainText = c.content ? c.content.replace(/<[^>]*>?/gm, '') : '';
      const synopsis = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
      const { content, ...rest } = c;

      return {
        ...rest,
        synopsis,
        author_name,
        is_bookmarked: true
      };
    }));

    res.status(200).json({ status: 'success', data: data.filter(d => d !== null) });
  } catch (error: any) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch bookmarks' });
  }
};

export const toggleBookmark = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // article_id
    const userId = (req as any).user?.userId;

    // Check if exists
    const existing = await executeQuery('user_bookmarks', [
      { field: 'user_id', op: '==', value: userId },
      { field: 'article_id', op: '==', value: id }
    ]);

    if (existing.length > 0) {
      // Remove
      await deleteDoc('user_bookmarks', existing[0].id);
      res.status(200).json({ status: 'success', bookmarked: false, message: 'Removed from bookmarks' });
    } else {
      // Add
      await createDoc('user_bookmarks', {
        user_id: userId,
        article_id: id,
        created_at: new Date()
      });
      res.status(200).json({ status: 'success', bookmarked: true, message: 'Added to bookmarks' });
    }
  } catch (error: any) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to toggle bookmark' });
  }
};
