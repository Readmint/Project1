import { Request, Response } from "express";
export declare const getAuthorProfile: (req: Request, res: Response) => Promise<void>;
export declare const updateAuthorProfile: (req: Request, res: Response) => Promise<void>;
export declare const updateProfilePhoto: (req: Request, res: Response) => Promise<void>;
export declare const updateAuthorStats: (req: Request, res: Response) => Promise<void>;
export declare const getAuthorStats: (req: Request, res: Response) => Promise<void>;
export declare const getSubscriptionPlans: (req: Request, res: Response) => Promise<void>;
export declare const getCurrentSubscription: (req: Request, res: Response) => Promise<void>;
export declare const incrementArticleCount: (userId: string) => Promise<void>;
export declare const incrementViews: (userId: string, views?: number) => Promise<void>;
export declare const addEarnings: (userId: string, amount: number) => Promise<void>;
export declare const getTopAuthors: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=author.controller.d.ts.map