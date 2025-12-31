import { Request, Response } from 'express';
export declare const getSubmissions: (req: Request, res: Response) => Promise<void>;
export declare const getEditors: (req: Request, res: Response) => Promise<void>;
export declare const getReviewers: (req: Request, res: Response) => Promise<void>;
export declare const assignEditor: (req: Request, res: Response) => Promise<void>;
export declare const assignReviewer: (req: Request, res: Response) => Promise<void>;
export declare const unassignEditor: (req: Request, res: Response) => Promise<void>;
export declare const getCommunications: (req: Request, res: Response) => Promise<void>;
export declare const getNotifications: (req: Request, res: Response) => Promise<void>;
export declare const sendMessage: (req: Request, res: Response) => Promise<void>;
export declare const getDashboardStats: (req: Request, res: Response) => Promise<void>;
export declare const checkPlagiarism: (req: Request, res: Response) => Promise<void>;
export declare const getSubmissionDetails: (req: Request, res: Response) => Promise<void>;
export declare const getReadyToPublish: (req: Request, res: Response) => Promise<void>;
export declare const publishContent: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=contentManager.controller.d.ts.map