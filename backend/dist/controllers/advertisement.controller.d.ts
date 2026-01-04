import { Request, Response } from 'express';
/**
 * ==========================================
 * ADVERTISEMENT PLANS (Admin Manageable)
 * ==========================================
 */
/**
 * GET /api/advertisement/plans
 * Public endpoint to fetch active plans
 */
export declare const getPlans: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/advertisement/plans
 * Admin only: Create a new plan
 */
export declare const createPlan: (req: Request, res: Response) => Promise<void>;
/**
 * PATCH /api/advertisement/plans/:id
 * Admin only: Update a plan
 */
export declare const updatePlan: (req: Request, res: Response) => Promise<void>;
/**
 * DELETE /api/advertisement/plans/:id
 * Admin only: Delete a plan
 */
export declare const deletePlan: (req: Request, res: Response) => Promise<void>;
/**
 * ==========================================
 * ENQUIRIES (Submissions & Review)
 * ==========================================
 */
/**
 * POST /api/advertisement/enquiries
 * Public: Submit an enquiry
 */
export declare const submitEnquiry: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/advertisement/enquiries
 * Admin: View all enquiries
 */
export declare const getEnquiries: (req: Request, res: Response) => Promise<void>;
/**
 * PATCH /api/advertisement/enquiries/:id/status
 * Admin: Update status
 */
export declare const updateEnquiryStatus: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=advertisement.controller.d.ts.map