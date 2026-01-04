interface MailAttachment {
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
}
export declare const sendEmail: (to: string, subject: string, html: string, attachments?: MailAttachment[]) => Promise<boolean>;
export {};
//# sourceMappingURL=mailer.d.ts.map