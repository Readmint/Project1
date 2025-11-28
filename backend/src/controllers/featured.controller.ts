import { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

// If your project has "noImplicitAny": true, the Firebase types below avoid implicit any.
export const getFeaturedContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    let featuredContent;

    // Detect Firestore by existence of 'collection' and narrow its type
    if ((db as any).collection) {
      const firestoreDb = db as FirebaseFirestore.Firestore;

      // Firebase - Get featured content
      const contentSnapshot = await firestoreDb.collection('content')
        .where('featured', '==', true)
        .where('status', '==', 'published')
        .orderBy('created_at', 'desc')
        .limit(10)
        .get();
      
      // Explicitly type the map parameter
      featuredContent = contentSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>)
      }));
    } else {
      // MySQL - Get featured content
      const [rows]: any = await db.execute(`
        SELECT c.*, u.name as author_name, cat.name as category_name 
        FROM content c 
        LEFT JOIN users u ON c.author_id = u.id 
        LEFT JOIN categories cat ON c.category_id = cat.id 
        WHERE c.featured = true AND c.status = 'published' 
        ORDER BY c.created_at DESC 
        LIMIT 10
      `);
      featuredContent = rows;
    }

    res.status(200).json({
      status: 'success',
      data: { featured: featuredContent }
    });
  } catch (error) {
    logger.error('Get featured content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getTrendingContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    let trendingContent;

    if ((db as any).collection) {
      const firestoreDb = db as FirebaseFirestore.Firestore;

      // Firebase - Get trending content
      const contentSnapshot = await firestoreDb.collection('content')
        .where('status', '==', 'published')
        .orderBy('trending_score', 'desc')
        .orderBy('likes_count', 'desc')
        .limit(15)
        .get();
      
      trendingContent = contentSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>)
      }));
    } else {
      // MySQL - Get trending content
      const [rows]: any = await db.execute(`
        SELECT c.*, u.name as author_name, cat.name as category_name 
        FROM content c 
        LEFT JOIN users u ON c.author_id = u.id 
        LEFT JOIN categories cat ON c.category_id = cat.id 
        WHERE c.status = 'published' 
        ORDER BY c.trending_score DESC, c.likes_count DESC 
        LIMIT 15
      `);
      trendingContent = rows;
    }

    res.status(200).json({
      status: 'success',
      data: { trending: trendingContent }
    });
  } catch (error) {
    logger.error('Get trending content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getLatestContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    let latestContent;

    if ((db as any).collection) {
      const firestoreDb = db as FirebaseFirestore.Firestore;

      // Firebase - Get latest content
      const contentSnapshot = await firestoreDb.collection('content')
        .where('status', '==', 'published')
        .orderBy('created_at', 'desc')
        .limit(20)
        .get();
      
      latestContent = contentSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>)
      }));
    } else {
      // MySQL - Get latest content
      const [rows]: any = await db.execute(`
        SELECT c.*, u.name as author_name, cat.name as category_name 
        FROM content c 
        LEFT JOIN users u ON c.author_id = u.id 
        LEFT JOIN categories cat ON c.category_id = cat.id 
        WHERE c.status = 'published' 
        ORDER BY c.created_at DESC 
        LIMIT 20
      `);
      latestContent = rows;
    }

    res.status(200).json({
      status: 'success',
      data: { latest: latestContent }
    });
  } catch (error) {
    logger.error('Get latest content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getPopularAuthors = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    let popularAuthors;

    if ((db as any).collection) {
      const firestoreDb = db as FirebaseFirestore.Firestore;

      // Firebase - Get popular authors (simplified)
      const usersSnapshot = await firestoreDb.collection('users')
        .where('role', 'in', ['author', 'editor'])
        .limit(12)
        .get();
      
      popularAuthors = usersSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>)
      }));
    } else {
      // MySQL - Get popular authors with content count
      const [rows]: any = await db.execute(`
        SELECT u.id, u.name, u.email, u.role, u.profile_data,
               COUNT(c.id) as content_count,
               SUM(c.likes_count) as total_likes
        FROM users u 
        LEFT JOIN content c ON u.id = c.author_id AND c.status = 'published'
        WHERE u.role IN ('author', 'editor')
        GROUP BY u.id
        ORDER BY total_likes DESC, content_count DESC
        LIMIT 12
      `);
      
      popularAuthors = rows.map((row: any) => ({
        ...row,
        profile_data: JSON.parse(row.profile_data || '{}')
      }));
    }

    res.status(200).json({
      status: 'success',
      data: { authors: popularAuthors }
    });
  } catch (error) {
    logger.error('Get popular authors error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
