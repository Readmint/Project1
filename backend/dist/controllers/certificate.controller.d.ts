import { Request, Response } from 'express';
/**
 * Generate Certificate PDF
 */
export declare const generateCertificatePDF: (certData: any) => Promise<Buffer>;
/**
 * Create Certificate for Article
 * Internal function called by article controller or manually
 */
export declare const createAndSendCertificate: (articleId: string) => Promise<{
    id: string;
}>;
/**
 * Controller: Get Certificate Verification
 * GET /api/certificates/:certId/verify
 */
export declare const verifyCertificate: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Controller: Generate Manual (Admin)
 * POST /api/admin/certificates/generate
 */
export declare const generateCertificateManually: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Controller: Get User Certificates
 * GET /api/certificates/my-certificates
 */
export declare const getMyCertificates: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=certificate.controller.d.ts.map