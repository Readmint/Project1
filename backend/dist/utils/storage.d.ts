import { Bucket } from '@google-cloud/storage';
/**
 * Helper to get the storage bucket instance.
 * Uses the firebase-admin initialized app's storage() bucket if available,
 * otherwise constructs a google-cloud/storage client using env vars.
 */
export declare const getStorageBucket: () => Bucket;
/**
 * getSignedUrl(path, mode, expiryMs, opts)
 * - path: storage path (object name) relative to the bucket
 * - mode: 'read' | 'write' (read => GET, write => PUT)
 * - expiryMs: number of milliseconds from now the signed URL should expire
 * - opts: { contentType?: string }
 *
 * Returns: Promise<string> (signed url)
 */
export declare const getSignedUrl: (storagePath: string, mode?: "read" | "write", expiryMs?: number, opts?: {
    contentType?: string;
}) => Promise<string>;
/**
 * Make an object public (best-effort).
 * Returns the public URL if succeeded.
 */
export declare const makeFilePublic: (storagePath: string) => Promise<string>;
/**
 * Delete a file from storage (best-effort)
 */
export declare const deleteFile: (storagePath: string) => Promise<void>;
//# sourceMappingURL=storage.d.ts.map