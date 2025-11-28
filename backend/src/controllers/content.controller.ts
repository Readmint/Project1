import { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    let categories;

    if ((db as any).collection) {
      // Firestore branch — narrow type and explicitly type `doc`
      const firestoreDb = db as FirebaseFirestore.Firestore;
      const categoriesSnapshot = await firestoreDb.collection('categories').get();

      categories = categoriesSnapshot.docs.map(
        (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...(doc.data() as Record<string, any>)
        })
      );
    } else {
      // MySQL - Get categories
      const [rows]: any = await db.execute(`
        SELECT c1.*, c2.name as parent_category_name
        FROM categories c1
        LEFT JOIN categories c2 ON c1.parent_category_id = c2.id
        ORDER BY c1.name
      `);
      categories = rows;
    }

    res.status(200).json({
      status: 'success',
      data: { categories }
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
    // parse and type query params
    const category = (req.query.category as string) || undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);
    const offset = (page - 1) * limit;

    const db = getDatabase();
    let magazines: any[] = [];
    let totalCount = 0;

    if ((db as any).collection) {
      const firestoreDb = db as FirebaseFirestore.Firestore;

      // Build Firestore query with typed variable
      let query: FirebaseFirestore.Query = firestoreDb
        .collection('content')
        .where('status', '==', 'published');

      if (category) {
        // Assuming category is stored as a string id in `category_id`
        query = query.where('category_id', '==', category);
      }

      // Get total count (Firestore doesn't have COUNT aggregation on all SDKs;
      // this approach fetches documents — ok for small datasets; consider using count() aggregation if available)
      const totalSnapshot = await query.get();
      totalCount = totalSnapshot.size;

      // apply ordering + pagination (offset + limit)
      const magazinesSnapshot = await query
        .orderBy('created_at', 'desc')
        .offset(offset)
        .limit(limit)
        .get();

      magazines = magazinesSnapshot.docs.map(
        (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...(doc.data() as Record<string, any>)
        })
      );
    } else {
      // MySQL - Get magazines with filters
      let baseQuery = `
        FROM content c 
        LEFT JOIN users u ON c.author_id = u.id 
        LEFT JOIN categories cat ON c.category_id = cat.id 
        WHERE c.status = 'published'
      `;

      const queryParams: any[] = [];

      if (category) {
        baseQuery += ' AND c.category_id = ?';
        queryParams.push(category);
      }

      // Get total count
      const [countRows]: any = await db.execute(`SELECT COUNT(*) as total ${baseQuery}`, queryParams);
      totalCount = countRows[0].total || 0;

      // Get paginated results
      const [rows]: any = await db.execute(
        `
        SELECT c.*, u.name as author_name, cat.name as category_name 
        ${baseQuery}
        ORDER BY c.created_at DESC 
        LIMIT ? OFFSET ?
      `,
        [...queryParams, limit, offset]
      );

      magazines = rows;
    }

    res.status(200).json({
      status: 'success',
      data: {
        magazines,
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
    const db = getDatabase();
    let authors;

    if ((db as any).collection) {
      const firestoreDb = db as FirebaseFirestore.Firestore;
      const authorsSnapshot = await firestoreDb
        .collection('users')
        .where('role', 'in', ['author', 'editor'])
        .get();

      authors = authorsSnapshot.docs.map(
        (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...(doc.data() as Record<string, any>)
        })
      );
    } else {
      // MySQL - Get authors with stats
      const [rows]: any = await db.execute(`
        SELECT u.*, 
               COUNT(c.id) as published_articles,
               SUM(c.likes_count) as total_likes
        FROM users u 
        LEFT JOIN content c ON u.id = c.author_id AND c.status = 'published'
        WHERE u.role IN ('author', 'editor')
        GROUP BY u.id
        ORDER BY total_likes DESC
      `);

      authors = rows.map((row: any) => ({
        ...row,
        profile_data: JSON.parse(row.profile_data || '{}')
      }));
    }

    res.status(200).json({
      status: 'success',
      data: { authors }
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
