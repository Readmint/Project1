import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let firestoreDb: any = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Connect to Firebase Firestore (for authentication / storage bucket)
    const projectId = process.env.READMINT_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.READMINT_FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.READMINT_FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
    const storageBucket = process.env.READMINT_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;

    if (projectId) {
      console.log('🔄 Initializing Firebase Firestore...');
      const serviceAccount = {
        projectId,
        privateKey: privateKey?.replace(/\\n/g, '\n'),
        clientEmail,
      };

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: storageBucket || `${projectId}.appspot.com`,
        });
      }

      firestoreDb = admin.firestore();
      firestoreDb.settings({ ignoreUndefinedProperties: true });
      logger.info('Connected to Firebase Firestore');
      console.log('✅ Connected to Firebase Firestore');
      console.log('📦 Storage bucket:', storageBucket || `${projectId}.appspot.com`);
    } else {
      logger.warn('FIREBASE_PROJECT_ID (or READMINT_ prefixed) not found in env, skipping Firebase init');
    }

    if (!firestoreDb) {
      throw new Error('Firestore database configuration not found or failed to initialize');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

export const ensureInitialized = () => {
  if (!admin.apps.length) {
    // Use default credentials (works in Cloud Functions)
    try {
      const projectId = process.env.READMINT_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      const storageBucket = process.env.READMINT_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);

      admin.initializeApp({
        storageBucket: storageBucket
      });
      console.log('✅ Firebase Admin Initialized (Lazy)');
    } catch (e) {
      console.error('Failed to lazy initialize Firebase Admin', e);
      // Fallback - might already be initialized?
      if (!admin.apps.length) throw e;
    }
  }
};

export const getStorageBucket = () => {
  ensureInitialized();
  return admin.storage().bucket();
};

export const getFirestoreDatabase = (): any => {
  if (!firestoreDb) {
    if (!admin.apps.length) ensureInitialized();
    firestoreDb = admin.firestore();
    firestoreDb.settings({ ignoreUndefinedProperties: true });
  }
  return firestoreDb;
};

// Main getDatabase function - defaults to Firestore
export const getDatabase = (): any => {
  return getFirestoreDatabase();
};

/**
 * Health / status helpers
 */
export const checkDatabaseStatus = async (): Promise<any> => {
  const status: any = {};

  try {
    if (firestoreDb) {
      // simple read test
      await firestoreDb.collection('test_connection').limit(1).get();
      status.firestore = { connected: true };
    } else {
      status.firestore = { connected: false };
    }
  } catch (error) {
    status.firestore = { connected: false, error: error instanceof Error ? error.message : String(error) };
  }

  return status;
};
