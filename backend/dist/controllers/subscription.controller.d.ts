import { Request, Response } from 'express';
export declare const getSubscriptionPlans: (req: Request, res: Response) => Promise<void>;
export declare const createPayUOrder: (req: Request, res: Response) => Promise<void>;
export declare const verifyPayUPayment: (req: Request, res: Response) => Promise<void>;
export declare const getPaymentStatus: (req: Request, res: Response) => Promise<void>;
export declare const payuWebhook: (req: Request, res: Response) => Promise<void>;
export declare const getUserSubscriptions: (req: Request, res: Response) => Promise<void>;
export declare const getCurrentSubscription: (req: Request, res: Response) => Promise<void>;
export declare const activateFreeSubscription: (req: Request, res: Response) => Promise<void>;
export declare const cancelSubscription: (req: Request, res: Response) => Promise<void>;
export declare const getAuthorSubscriptionPlans: (req: Request, res: Response) => Promise<void>;
export declare const getUserPaymentHistory: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    getSubscriptionPlans: (req: Request, res: Response) => Promise<void>;
    createPayUOrder: (req: Request, res: Response) => Promise<void>;
    verifyPayUPayment: (req: Request, res: Response) => Promise<void>;
    getPaymentStatus: (req: Request, res: Response) => Promise<void>;
    payuWebhook: (req: Request, res: Response) => Promise<void>;
    getUserSubscriptions: (req: Request, res: Response) => Promise<void>;
    getCurrentSubscription: (req: Request, res: Response) => Promise<void>;
    activateFreeSubscription: (req: Request, res: Response) => Promise<void>;
    cancelSubscription: (req: Request, res: Response) => Promise<void>;
    getAuthorSubscriptionPlans: (req: Request, res: Response) => Promise<void>;
    getUserPaymentHistory: (req: Request, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=subscription.controller.d.ts.map