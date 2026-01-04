type CollectionName = 'users' | 'partners' | 'partner_events' | 'authors' | 'author_stats' | 'categories' | 'content' | 'attachments' | 'plagiarism_reports' | 'workflow_events' | 'reviews' | 'subscription_plans' | 'payment_orders' | 'user_subscriptions' | 'payment_transactions' | 'readers' | 'reading_progress' | 'user_likes' | 'user_bookmarks' | 'article_comments' | 'user_purchases' | 'recommendations' | 'editors' | 'editor_assignments' | 'notifications' | 'communications' | 'editor_activity' | 'versions' | 'reviewer_assignments' | 'article_co_authors' | 'admin_otps' | 'admin_audit_logs' | 'incidents' | 'orders' | 'system_settings' | 'advertisement_plans' | 'advertisement_enquiries' | 'editorial_applications' | 'career_roles' | 'career_applications' | 'certificates';
export declare const getCollection: (collectionName: CollectionName) => any;
export declare const getDoc: (collectionName: CollectionName, docId: string) => Promise<any>;
export declare const createDoc: (collectionName: CollectionName, data: any, docId?: string) => Promise<any>;
export declare const updateDoc: (collectionName: CollectionName, docId: string, data: any) => Promise<any>;
export declare const deleteDoc: (collectionName: CollectionName, docId: string) => Promise<boolean>;
export declare const executeQuery: (collectionName: CollectionName, filters?: {
    field: string;
    op: FirebaseFirestore.WhereFilterOp;
    value: any;
}[], limit?: number, orderBy?: {
    field: string;
    dir: "asc" | "desc";
}) => Promise<{
    id: string;
}[]>;
export declare const getCount: (collectionName: CollectionName, filters?: {
    field: string;
    op: FirebaseFirestore.WhereFilterOp;
    value: any;
}[]) => Promise<number>;
export {};
//# sourceMappingURL=firestore-helpers.d.ts.map