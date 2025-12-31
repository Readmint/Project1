import { Request, Response } from 'express';
export declare const forgotPassword: (req: Request, res: Response) => Promise<void>;
export declare const verifyResetOTP: (req: Request, res: Response) => Promise<void>;
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
export declare const sendVerificationEmail: (req: Request, res: Response) => Promise<void>;
export declare const verifyEmail: (req: Request, res: Response) => Promise<void>;
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const oauth: (req: Request, res: Response) => Promise<void>;
export declare const getCurrentUser: (req: Request, res: Response) => Promise<void>;
export declare const resendVerification: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map