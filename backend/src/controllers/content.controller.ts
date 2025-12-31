
import { Request, Response } from 'express';
// import { getDatabase } from '../config/database'; 
import { logger } from '../utils/logger';
import { executeQuery, getDoc, createDoc, updateDoc } from '../utils/firestore-helpers';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await executeQuery('categories', [], undefined, { field: 'name', dir: 'asc' });

    // Parent category name logic (Manual Join)
    // If categories have parent_category_id
    const validCategories = await Promise.all(categories.map(async (c: any) => {
      let parentName = null;
      if (c.parent_category_id) {
        const p: any = await getDoc('categories', c.parent_category_id);
        if (p) parentName = p.name;
      }
      return {
        ...c,
        parent_category_name: parentName
      };
    }));

    res.status(200).json({
      status: 'success',
      data: { categories: validCategories }
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getMagazines = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = (req.query.category as string) || undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);
    // Offset logic invalid for Firestore in simple terms, but `executeQuery` mimics limit/order.
    // Real Firestore pagination requires cursors. 
    // For now, we will fetch ALMOST ALL or use limit logic from helpers.
    // Helper supports 'limit'. But offset is tricky. 
    // We will use the 'getAll and slice' approach since we lack cursors for now, assuming N < 1000.

    // Build filters
    const filters: any[] = [{ field: 'status', op: '==', value: 'published' }];
    if (category) {
      filters.push({ field: 'category_id', op: '==', value: category });
    }

    // Fetch all for pagination (efficient count? no, just fetch all for now or use count helper)
    // We need data, not just count.

    let allMags = await executeQuery('content', filters, undefined, { field: 'created_at', dir: 'desc' });

    // Sort logic (already sorted by helpers)

    const totalCount = allMags.length;
    const startIndex = (page - 1) * limit;
    const paginatedMags = allMags.slice(startIndex, startIndex + limit);

    // Expand details (Author Name, Category Name)
    const expandedMags = await Promise.all(paginatedMags.map(async (m: any) => {
      let authorName = 'Unknown';
      if (m.author_id) {
        const u: any = await getDoc('users', m.author_id);
        if (u) authorName = u.name;
      }
      let categoryName = 'Uncategorized';
      if (m.category_id) {
        const c: any = await getDoc('categories', m.category_id);
        if (c) categoryName = c.name;
        else categoryName = m.category_id;
      }

      return {
        ...m,
        author_name: authorName,
        category_name: categoryName
      };
    }));

    res.status(200).json({
      status: 'success',
      data: {
        magazines: expandedMags,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get magazines error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getAuthors = async (req: Request, res: Response): Promise<void> => {
  try {
    // In Firestore, we use 'author_stats' for pre-aggregated data or fetch users and aggregate manually.
    // Let's use 'author_stats' if available (created in featured controller). 
    // If not, we fetch 'users' where role IN [author, editor].

    // Fetch users
    const authors = await executeQuery('users', []);
    const validAuthors = authors.filter((u: any) => ['author', 'editor'].includes(u.role));

    // To get stats (published_articles, total_likes), we need to query 'content' or 'author_stats'.
    // Querying 'content' for each author is N+1. 
    // Use `author_stats` collection if it exists.
    // Fallback: Fetch ALL published content and aggregate in memory.

    const allContent = await executeQuery('content', [{ field: 'status', op: '==', value: 'published' }]);

    const statsMap = new Map<string, { articles: number, likes: number }>();

    allContent.forEach((c: any) => {
      if (c.author_id) {
        const current = statsMap.get(c.author_id) || { articles: 0, likes: 0 };
        current.articles += 1;
        current.likes += (c.likes_count || 0);
        statsMap.set(c.author_id, current);
      }
    });

    const annotatedAuthors = validAuthors.map((u: any) => {
      const stats = statsMap.get(u.id) || { articles: 0, likes: 0 };
      return {
        ...u,
        published_articles: stats.articles,
        total_likes: stats.likes,
        profile_data: u.profile_data || {} // Firestore stores object
      };
    }).sort((a: any, b: any) => b.total_likes - a.total_likes);

    res.status(200).json({
      status: 'success',
      data: { authors: annotatedAuthors }
    });
  } catch (error) {
    logger.error('Get authors error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getPublicReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    // Mock reviews for now
    const mockReviews = [
      {
        id: '1',
        reader_name: 'Sarah Johnson',
        rating: 5,
        review: 'Amazing platform with diverse content!',
        magazine_reviewed: 'Tech Insights Monthly'
      },
      {
        id: '2',
        reader_name: 'Mike Chen',
        rating: 4,
        review: 'Great selection of magazines, easy to use interface.',
        magazine_reviewed: 'Business Weekly'
      },
      {
        id: '3',
        reader_name: 'Emma Davis',
        rating: 5,
        review: 'Love the author community and quality content!',
        magazine_reviewed: 'Creative Writing Digest'
      }
    ];

    res.status(200).json({
      status: 'success',
      data: { reviews: mockReviews }
    });
  } catch (error) {
    logger.error('Get public reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const updateDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { designData, pages } = req.body;

    if (!designData) {
      res.status(400).json({ status: 'error', message: 'No design data provided' });
      return;
    }

    const article: any = await getDoc('content', id);
    if (!article) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    // designData is passed as JSON object (or string?). 
    // Firestore stores objects natively.
    // Ensure we store it as object/map.
    let dataToStore = designData;
    if (typeof designData === 'string') {
      try { dataToStore = JSON.parse(designData); } catch (e) { }
    }

    await updateDoc('content', id, {
      design_data: dataToStore,
      updated_at: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: 'Design saved successfully'
    });
  } catch (error: any) {
    logger.error('Update design error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const submitDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { designData } = req.body;

    const article: any = await getDoc('content', id);
    if (!article) {
      res.status(404).json({ status: 'error', message: 'Article not found' });
      return;
    }

    const updates: any = {
      status: 'under_review', // Transition to under_review
      updated_at: new Date()
    };

    if (designData) {
      let dataToStore = designData;
      if (typeof designData === 'string') {
        try { dataToStore = JSON.parse(designData); } catch (e) { }
      }
      updates.design_data = dataToStore;
    }

    await updateDoc('content', id, updates);

    // Create workflow event
    await createDoc('workflow_events', {
      article_id: id,
      from_status: article.status,
      to_status: 'under_review',
      note: 'Design submitted by Editor for review',
      created_at: new Date()
    });

    res.status(200).json({
      status: 'success',
      message: 'Design submitted for review successfully'
    });
  } catch (error: any) {
    logger.error('Submit design error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
