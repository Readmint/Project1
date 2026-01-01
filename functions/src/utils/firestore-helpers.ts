import admin from 'firebase-admin';
import { getDatabase } from '../config/database';
import { logger } from './logger';

type CollectionName =
    | 'users'
    | 'partners'
    | 'partner_events'
    | 'authors'
    | 'author_stats'
    | 'categories'
    | 'content' // articles
    | 'attachments'
    | 'plagiarism_reports'
    | 'workflow_events'
    | 'reviews'
    | 'subscription_plans'
    | 'payment_orders'
    | 'user_subscriptions'
    | 'payment_transactions'
    | 'readers'
    | 'reading_progress'
    | 'user_likes'
    | 'user_bookmarks'
    | 'article_comments'
    | 'user_purchases'
    | 'recommendations'
    | 'editors'
    | 'editor_assignments'
    | 'notifications'
    | 'communications'
    | 'editor_activity'
    | 'versions'
    | 'reviewer_assignments'
    | 'article_co_authors' // Might embed this, but keeping for now
    | 'admin_otps'
    | 'admin_audit_logs'
    | 'incidents'
    | 'orders'
    | 'system_settings'
    | 'editorial_applications';

export const getCollection = (collectionName: CollectionName) => {
    const db = getDatabase();
    return db.collection(collectionName);
};

export const getDoc = async (collectionName: CollectionName, docId: string) => {
    try {
        const doc = await getCollection(collectionName).doc(docId).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        logger.error(`Error fetching doc ${collectionName}/${docId}:`, error);
        throw error;
    }
};

export const createDoc = async (collectionName: CollectionName, data: any, docId?: string) => {
    try {
        const colRef = getCollection(collectionName);
        const docRef = docId ? colRef.doc(docId) : colRef.doc();

        // Add timestamps
        const now = admin.firestore.FieldValue.serverTimestamp();
        const finalData = {
            ...data,
            created_at: data.created_at || now,
            updated_at: now
        };

        await docRef.set(finalData);
        return { id: docRef.id, ...finalData };
    } catch (error) {
        logger.error(`Error creating doc in ${collectionName}:`, error);
        throw error;
    }
};

export const updateDoc = async (collectionName: CollectionName, docId: string, data: any) => {
    try {
        const docRef = getCollection(collectionName).doc(docId);

        const finalData = {
            ...data,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        await docRef.update(finalData);
        return { id: docId, ...finalData };
    } catch (error) {
        logger.error(`Error updating doc ${collectionName}/${docId}:`, error);
        throw error;
    }
};

export const deleteDoc = async (collectionName: CollectionName, docId: string) => {
    try {
        await getCollection(collectionName).doc(docId).delete();
        return true;
    } catch (error) {
        logger.error(`Error deleting doc ${collectionName}/${docId}:`, error);
        throw error;
    }
};


export const executeQuery = async (
    collectionName: CollectionName,
    filters: { field: string, op: FirebaseFirestore.WhereFilterOp, value: any }[] = [],
    limit?: number,
    orderBy?: { field: string, dir: 'asc' | 'desc' }
) => {
    try {
        let query: FirebaseFirestore.Query = getCollection(collectionName);

        filters.forEach(f => {
            query = query.where(f.field, f.op, f.value);
        });

        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.dir);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        logger.error(`Error executing query on ${collectionName}:`, error);
        throw error;
    }
};

export const getCount = async (
    collectionName: CollectionName,
    filters: { field: string, op: FirebaseFirestore.WhereFilterOp, value: any }[] = []
): Promise<number> => {
    try {
        let query: FirebaseFirestore.Query = getCollection(collectionName);

        filters.forEach(f => {
            query = query.where(f.field, f.op, f.value);
        });

        const snapshot = await query.count().get();
        return snapshot.data().count;
    } catch (error) {
        logger.error(`Error counting ${collectionName}:`, error);
        return 0; // Return 0 on error safely
    }
};

