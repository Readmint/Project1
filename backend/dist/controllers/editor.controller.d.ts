import { Request, Response } from "express";
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
export declare const getEditorProfile: (req: Request, res: Response) => Promise<void>;
export declare const saveEditorProfile: (req: Request, res: Response) => Promise<void>;
export declare const uploadEditorResume: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
export declare const getAssignedForEditor: (req: Request, res: Response) => Promise<void>;
export declare const getSubmittedForEditor: (req: Request, res: Response) => Promise<void>;
/**
 * GET article for editor -> returns article + attachments (with signed read URLs when possible) + workflow events + reviews + versions
 */
export declare const getArticleForEdit: (req: Request, res: Response) => Promise<void>;
export declare const saveDraft: (req: Request, res: Response) => Promise<void>;
export declare const finalizeEditing: (req: Request, res: Response) => Promise<void>;
export declare const requestAuthorChanges: (req: Request, res: Response) => Promise<void>;
export declare const approveForPublishing: (req: Request, res: Response) => Promise<void>;
export declare const getVersions: (req: Request, res: Response) => Promise<void>;
export declare const getVersionById: (req: Request, res: Response) => Promise<void>;
export declare const restoreVersion: (req: Request, res: Response) => Promise<void>;
export declare const getEditorAnalytics: (req: Request, res: Response) => Promise<void>;
export declare const getCommunications: (req: Request, res: Response) => Promise<void>;
export declare const getContentManagers: (req: Request, res: Response) => Promise<void>;
export declare const sendMessage: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=editor.controller.d.ts.map