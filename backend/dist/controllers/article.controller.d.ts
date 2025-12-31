import { Request, Response } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId?: string;
                role?: string;
                email?: string;
            };
        }
    }
}
/**
 * POST /api/author/articles
 */
export declare const createArticle: (req: Request, res: Response) => Promise<void>;
/**
 * PATCH /api/author/articles/:articleId
 */
export declare const updateArticleContent: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/author/articles/categories
 */
export declare const getCategories: (req: Request, res: Response) => Promise<void>;
/**
 * Deprecated signed URL endpoints: kept for compatibility but intentionally return 501 guidance.
 */
export declare const getAttachmentSignedUrl: (req: Request, res: Response) => Promise<void>;
export declare const completeAttachmentUpload: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/author/articles/:articleId/attachments
 * multipart/form-data field: file
 *
 * router should attach multer middleware on this route: upload.single('file')
 */
export declare const uploadAttachment: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/author/articles/:articleId/attachments/:attachmentId
 * Redirection to signed URL or public URL
 */
export declare const downloadAttachment: (req: Request, res: Response) => Promise<void>;
export declare const getAttachmentSignedDownloadUrl: (req: Request, res: Response) => Promise<void>;
/**
 * DELETE /api/author/articles/:articleId/attachments/:attachmentId
 */
export declare const deleteAttachment: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/author/articles
 */
export declare const listAuthorArticles: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/author/articles/:articleId
 */
export declare const getArticleDetails: (req: Request, res: Response) => Promise<void>;
/**
 * PATCH /api/author/articles/:articleId/status
 */
export declare const updateArticleStatus: (req: Request, res: Response) => Promise<void>;
/**
 * DELETE /api/author/articles/:articleId
 */
export declare const deleteArticle: (req: Request, res: Response) => Promise<void>;
/**
 * computeTfidfSimilarities
 * attachments: Array<{ id, filename, buffer }>
 * returns { docs: [{ id, filename, text }], pairs: [{ aId, bId, score }] }
 */
export declare function computeTfidfSimilarities(attachments: {
    id: string;
    filename: string;
    buffer: Buffer;
}[]): Promise<{
    docs: {
        id: string;
        filename: string;
        text: string;
    }[];
    pairs: {
        aId: string;
        bId: string;
        score: number;
    }[];
}>;
/**
 * Route handler: POST /api/author/articles/:articleId/similarity
 * - Authenticated
 * - Author or privileged roles OR article author allowed
 * - Downloads attachments (public_url or GCS path) + scrapes web
 * - Runs TF-IDF similarity and returns top pairs
 */
export declare const runSimilarityCheck: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/admin/articles/:articleId/plagiarism
 *
 * Runs JPlag (via Docker) + AI Heuristics against attachments.
 * Saves report to storage and metadata to plagiarism_reports.
 */
export declare const runPlagiarismCheck: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=article.controller.d.ts.map