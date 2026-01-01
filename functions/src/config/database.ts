import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let firestoreDb: any = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!admin.apps.length) {
      // Use Application Default Credentials (best for Cloud Functions)
      // If FIREBASE_PRIVATE_KEY is present, we can use it (local dev), otherwise default.
      if (process.env.FIREBASE_PRIVATE_KEY) {
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
        });
      } else {
        admin.initializeApp(); // Use ADC
      }
    }

    firestoreDb = admin.firestore();
    logger.info('Connected to Firebase Firestore');
    console.log('✅ Connected to Firebase Firestore (via ADC or Config)');

    if (!firestoreDb) {
      throw new Error('Firestore database not initialized');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    logger.error('Database connection failed:', error);
    // process.exit(1); // Do not crash the container!
  }
};

export const getStorageBucket = () => {
  return admin.storage().bucket();
};

export const getFirestoreDatabase = (): any => {
  if (!firestoreDb) {
    throw new Error('Firestore database not initialized');
  }
  return firestoreDb;
};

// Main getDatabase function - defaults to Firestore
export const getDatabase = (): any => {
  if (firestoreDb) {
    return firestoreDb;
  }
  throw new Error('No database initialized');
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
