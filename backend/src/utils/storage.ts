// src/utils/storage.ts
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

/**
 * Helper to get the storage bucket instance.
 * Uses the firebase-admin initialized app's storage() bucket if available,
 * otherwise constructs a google-cloud/storage client using env vars.
 */
export const getStorageBucket = (): any => {
  // If firebase-admin initialized, admin.storage() should exist
  try {
    const fbBucket = admin.storage && admin.storage().bucket();
    if (fbBucket && fbBucket.name) {
      return fbBucket;
    }
  } catch (e) {
    // continue to fallback
  }

  // fallback: use google-cloud storage client (requires GOOGLE_APPLICATION_CREDENTIALS or env keys)
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
  if (!bucketName) throw new Error('FIREBASE_STORAGE_BUCKET or FIREBASE_PROJECT_ID must be set');
  const storage = new Storage();
  return storage.bucket(bucketName);
};

/**
 * getSignedUrl(path, mode, expiryMs, opts)
 * - path: storage path (object name)
 * - mode: 'read' | 'write'
 * - expiryMs: number of milliseconds from now the signed URL should expire
 * - opts: { contentType?: string }
 *
 * Returns: Promise<string> (signed url)
 */
export const getSignedUrl = async (
  storagePath: string,
  mode: 'read' | 'write' = 'read',
  expiryMs: number = 15 * 60 * 1000,
  opts: { contentType?: string } = {}
): Promise<string> => {
  const bucket = getStorageBucket();
  if (!bucket) throw new Error('Storage bucket not configured');

  const file = bucket.file(storagePath);

  const expires = Date.now() + expiryMs;
  const expiresDate = new Date(expires);

  // google-cloud-storage requires options slightly differently, use file.getSignedUrl
  const action = mode === 'write' ? 'write' : 'read';

  const getUrlOptions: any = {
    action,
    expires: expiresDate,
  };

  // For write signed URLs you may want to force contentType; the client must set content-type accordingly when uploading.
  if (opts.contentType && action === 'write') {
    getUrlOptions.contentType = opts.contentType;
  }

  // file.getSignedUrl returns a Promise resolving to [url] or throws
  const [url] = await file.getSignedUrl(getUrlOptions);
  return url;
};
