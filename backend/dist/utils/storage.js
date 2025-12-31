"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.makeFilePublic = exports.getSignedUrl = exports.getStorageBucket = void 0;
// src/utils/storage.ts
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const storage_1 = require("@google-cloud/storage");
/**
 * Helper to get the storage bucket instance.
 * Uses the firebase-admin initialized app's storage() bucket if available,
 * otherwise constructs a google-cloud/storage client using env vars.
 */
const getStorageBucket = () => {
    // Try firebase-admin bucket first (if admin has been initialized)
    try {
        // When admin is initialized, admin.storage() should be available
        if (firebase_admin_1.default && firebase_admin_1.default.storage) {
            const fbStorage = firebase_admin_1.default.storage();
            if (fbStorage && typeof fbStorage.bucket === 'function') {
                const fbBucket = fbStorage.bucket();
                if (fbBucket && fbBucket.name) {
                    return fbBucket;
                }
            }
        }
    }
    catch (e) {
        // fall through to fallback
    }
    // fallback: use google-cloud storage client with explicit credentials from env
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    if (!bucketName)
        throw new Error('FIREBASE_STORAGE_BUCKET or FIREBASE_PROJECT_ID must be set');
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Handle escaped newlines in private key if present
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (projectId && clientEmail && privateKey) {
        const storage = new storage_1.Storage({
            projectId,
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            }
        });
        return storage.bucket(bucketName);
    }
    else {
        console.warn("⚠️  Missing GCS Credentials for manual config:");
        if (!projectId)
            console.warn("   - FIREBASE_PROJECT_ID is missing");
        if (!clientEmail)
            console.warn("   - FIREBASE_CLIENT_EMAIL is missing");
        if (!privateKey)
            console.warn("   - FIREBASE_PRIVATE_KEY is missing");
        console.warn("   Attempting to use Default Application Credentials...");
    }
    // If no env vars, fallback to default (ADC) which might throw if not configured on machine
    const storage = new storage_1.Storage();
    return storage.bucket(bucketName);
};
exports.getStorageBucket = getStorageBucket;
/**
 * getSignedUrl(path, mode, expiryMs, opts)
 * - path: storage path (object name) relative to the bucket
 * - mode: 'read' | 'write' (read => GET, write => PUT)
 * - expiryMs: number of milliseconds from now the signed URL should expire
 * - opts: { contentType?: string }
 *
 * Returns: Promise<string> (signed url)
 */
const getSignedUrl = async (storagePath, mode = 'read', expiryMs = 15 * 60 * 1000, opts = {}) => {
    if (!storagePath)
        throw new Error('storagePath is required for getSignedUrl');
    const bucket = (0, exports.getStorageBucket)();
    if (!bucket)
        throw new Error('Storage bucket not configured');
    const file = bucket.file(storagePath);
    const expires = Date.now() + expiryMs;
    const expiresDate = new Date(expires);
    // google-cloud-storage expects action: 'read'|'write'|'delete'|'resumable'
    const action = mode === 'write' ? 'write' : 'read';
    const getUrlOptions = {
        action,
        expires: expiresDate,
    };
    // For 'write' (upload) signed URLs, you may need to require a specific contentType,
    // client must set this content-type when uploading with the signed URL.
    if (opts.contentType && action === 'write') {
        getUrlOptions.contentType = opts.contentType;
    }
    // file.getSignedUrl returns Promise<[string]>; return the first string
    try {
        const [url] = await file.getSignedUrl(getUrlOptions);
        return url;
    }
    catch (error) {
        console.warn(`getSignedUrl failed for ${storagePath}: ${error.message}`);
        // Fallback: return public URL construction
        return `https://storage.googleapis.com/${bucket.name}/${encodeURI(storagePath)}`;
    }
};
exports.getSignedUrl = getSignedUrl;
/**
 * Make an object public (best-effort).
 * Returns the public URL if succeeded.
 */
const makeFilePublic = async (storagePath) => {
    if (!storagePath)
        throw new Error('storagePath is required for makeFilePublic');
    const bucket = (0, exports.getStorageBucket)();
    const file = bucket.file(storagePath);
    await file.makePublic();
    const bucketName = bucket.name || process.env.FIREBASE_STORAGE_BUCKET;
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURI(storagePath)}`;
    return publicUrl;
};
exports.makeFilePublic = makeFilePublic;
/**
 * Delete a file from storage (best-effort)
 */
const deleteFile = async (storagePath) => {
    if (!storagePath)
        return;
    const bucket = (0, exports.getStorageBucket)();
    const file = bucket.file(storagePath);
    await file.delete().catch((err) => {
        // swallow errors (caller should log if needed)
        // but rethrow if needed: throw err;
    });
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=storage.js.map