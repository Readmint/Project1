import { Request, Response } from 'express';
export interface JobRole {
    id: string;
    role: string;
    department: string;
    type: string;
    openings: number;
    experience: string;
    description: string;
    icon: string;
    image: string;
    posted_at: string;
    closing_date?: string;
    status: 'active' | 'closed';
}
export interface JobApplication {
    id: string;
    role_id: string;
    role_name: string;
    applicant_name: string;
    email: string;
    phone: string;
    resume_link: string;
    portfolio_link?: string;
    cover_letter?: string;
    applied_at: string;
    status: 'pending' | 'reviewed' | 'interviewing' | 'rejected' | 'hired';
}
/**
 * Create a new Job Role (Admin/CM)
 */
export declare const createRole: (req: Request, res: Response) => Promise<void>;
/**
 * Get all active Job Roles (Public)
 * Admins might want to see all including closed, via query param ?all=true
 */
export declare const getRoles: (req: Request, res: Response) => Promise<void>;
/**
 * Get single Role details (Public)
 */
export declare const getRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update a Job Role (Admin/CM)
 */
export declare const updateRole: (req: Request, res: Response) => Promise<void>;
/**
 * Delete a Job Role (Admin/CM)
 */
export declare const deleteRole: (req: Request, res: Response) => Promise<void>;
/**
 * Submit a Job Application (Public)
 */
export declare const submitApplication: (req: Request, res: Response) => Promise<void>;
/**
 * Get all Applications (Admin/CM)
 */
export declare const getApplications: (req: Request, res: Response) => Promise<void>;
/**
 * Update Application Status (Admin/CM)
 */
export declare const updateApplicationStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=career.controller.d.ts.map