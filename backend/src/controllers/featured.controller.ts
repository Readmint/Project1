import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { executeQuery, getDoc } from '../utils/firestore-helpers';

export const getFeaturedContent = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get featured content
    const featuredContent = await executeQuery('content', [
      { field: 'featured', op: '==', value: true },
      { field: 'status', op: '==', value: 'published' }
    ], 10, { field: 'created_at', dir: 'desc' });

    // Manual join for author names and categories
    const results = await Promise.all(featuredContent.map(async (c: any) => {
      let authorName = 'Unknown';
      if (c.author_id) {
        const u: any = await getDoc('users', c.author_id);
        if (u) authorName = u.name;
      }

      let categoryName = c.category_id || 'General';
      if (c.category_id) {
        const cat: any = await getDoc('categories', c.category_id);
        if (cat) categoryName = cat.name;
      }

      return { ...c, author_name: authorName, category_name: categoryName };
    }));

    res.status(200).json({
      status: 'success',
      data: { featured: results }
    });
  } catch (error: any) {
    logger.error('Get featured content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getTrendingContent = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get trending content
    // Sort by trending_score desc, likes_count desc
    // executeQuery supports one orderBy. Firestore supports multiple if index exists.
    // We'll sort by trending_score.
    const trendingContent = await executeQuery('content', [
      { field: 'status', op: '==', value: 'published' }
    ], 15, { field: 'trending_score', dir: 'desc' });

    // Manual join
    const results = await Promise.all(trendingContent.map(async (c: any) => {
      let authorName = 'Unknown';
      if (c.author_id) {
        const u: any = await getDoc('users', c.author_id);
        if (u) authorName = u.name;
      }
      let categoryName = c.category_id || 'General';
      if (c.category_id) {
        const cat: any = await getDoc('categories', c.category_id);
        if (cat) categoryName = cat.name;
      }
      return { ...c, author_name: authorName, category_name: categoryName };
    }));

    res.status(200).json({
      status: 'success',
      data: { trending: results }
    });
  } catch (error: any) {
    logger.error('Get trending content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getLatestContent = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get latest content
    const latestContent = await executeQuery('content', [
      { field: 'status', op: '==', value: 'published' }
    ], 20, { field: 'created_at', dir: 'desc' });

    // Manual join
    const results = await Promise.all(latestContent.map(async (c: any) => {
      let authorName = 'Unknown';
      if (c.author_id) {
        const u: any = await getDoc('users', c.author_id);
        if (u) authorName = u.name;
      }
      let categoryName = c.category_id || 'General';
      if (c.category_id) {
        const cat: any = await getDoc('categories', c.category_id);
        if (cat) categoryName = cat.name;
      }
      return { ...c, author_name: authorName, category_name: categoryName };
    }));

    res.status(200).json({
      status: 'success',
      data: { latest: results }
    });
  } catch (error: any) {
    logger.error('Get latest content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getPopularAuthors = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use author_stats to get popular authors
    const topStats = await executeQuery('author_stats', [], 12, { field: 'total_views', dir: 'desc' });

    // Fetch author details
    const authors = await Promise.all(topStats.map(async (stat: any) => {
      let authorUser: any = null;
      if (stat.author_id) {
        // Try author profile first
        authorUser = await getDoc('authors', stat.author_id);

        // If not found (maybe author_id is user_id), try users?
        if (!authorUser) {
          const u: any = await getDoc('users', stat.author_id);
          if (u) {
            authorUser = {
              id: u.id,
              display_name: u.name,
              user_id: u.id,
              profile_photo_url: null
            };
          }
        }
      }

      if (!authorUser) return null;

      return {
        id: authorUser.id, // author profile id or user id
        name: authorUser.display_name,
        email: null, // Don't expose email publicly?
        role: 'author',
        profile_data: {}, // simplified
        content_count: stat.articles_published || 0,
        total_likes: stat.total_views || 0 // Proxy views as likes/popularity since likes might not be aggregated
      };
    }));

    // Filter nulls
    const validAuthors = authors.filter(a => a !== null);

    res.status(200).json({
      status: 'success',
      data: { authors: validAuthors }
    });
  } catch (error: any) {
    logger.error('Get popular authors error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
