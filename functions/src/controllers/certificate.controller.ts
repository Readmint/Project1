import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { getDatabase, getStorageBucket } from '../config/database';
import { logger } from '../utils/logger';
import { getDoc, createDoc, executeQuery } from '../utils/firestore-helpers';
import { sendEmail } from '../utils/mailer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper to format date
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
};

/**
 * Generate Certificate PDF
 */
export const generateCertificatePDF = async (certData: any): Promise<Buffer> => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                layout: 'landscape',
                size: 'A4',
                margin: 0
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Colors
            const goldColor = '#D4AF37';
            const navyColor = '#0A2463';
            const darkGrey = '#333333';

            // --- BORDER ---
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                .lineWidth(5)
                .stroke(navyColor);

            doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
                .lineWidth(2)
                .stroke(goldColor);

            // --- HEADER ---
            doc.moveDown(2);
            doc.font('Helvetica-Bold').fontSize(24).fillColor(navyColor)
                .text('MINDRADIX', { align: 'center' });

            doc.font('Helvetica').fontSize(10).fillColor(darkGrey)
                .text('Excellence in Digital Publishing', { align: 'center' });

            doc.moveDown(2);

            // Main Title
            doc.font('Helvetica-Bold').fontSize(42).fillColor(goldColor)
                .text('CERTIFICATE OF PUBLICATION', { align: 'center' });

            doc.moveDown(1);
            doc.font('Helvetica').fontSize(14).fillColor(darkGrey)
                .text('This certificate is proudly awarded to', { align: 'center' });

            doc.moveDown(1);

            // --- AUTHOR NAME ---
            doc.font('Helvetica-Bold').fontSize(32).fillColor(navyColor)
                .text(certData.authorName, { align: 'center' });

            doc.moveDown(0.5);
            doc.rect(200, doc.y, doc.page.width - 400, 2).fill(goldColor);
            doc.moveDown(1);

            // --- DETAILS ---
            doc.font('Helvetica').fontSize(14).fillColor(darkGrey)
                .text('In recognition of the publication of the article entitled', { align: 'center' });

            doc.moveDown(1);

            // Article Title (Handle wrapping if long)
            doc.font('Helvetica-BoldOblique').fontSize(20).fillColor(navyColor)
                .text(`"${certData.articleTitle}"`, { align: 'center', width: 600 } as any);

            doc.moveDown(1);
            doc.font('Helvetica').fontSize(14).fillColor(darkGrey)
                .text(`Published in MindRadix ${certData.publicationType} on ${certData.publishedDate}`, { align: 'center' });

            doc.moveDown(4);

            // --- SIGNATURES & FOOTER ---
            const bottomY = 480;

            // QR Code Generation
            const verifyUrl = `${process.env.FRONTEND_URL || 'https://mindradix.com'}/verify-certificate?id=${certData.id}`;
            const qrDataUrl = await QRCode.toDataURL(verifyUrl);
            const qrImage = Buffer.from(qrDataUrl.split(',')[1], 'base64');

            // Left Signature
            doc.lineWidth(1).moveTo(100, bottomY).lineTo(300, bottomY).stroke(navyColor);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(navyColor)
                .text('Dr. S. K. Singh', 100, bottomY + 10, { width: 200, align: 'center' });
            doc.font('Helvetica').fontSize(10).fillColor(darkGrey)
                .text('Editor-in-Chief', 100, bottomY + 25, { width: 200, align: 'center' });

            // Right Signature
            doc.lineWidth(1).moveTo(540, bottomY).lineTo(740, bottomY).stroke(navyColor);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(navyColor)
                .text('MindRadix Admin', 540, bottomY + 10, { width: 200, align: 'center' });
            doc.font('Helvetica').fontSize(10).fillColor(darkGrey)
                .text('Authorized Signatory', 540, bottomY + 25, { width: 200, align: 'center' });

            // Badge / QR Code Center
            doc.image(qrImage, (doc.page.width / 2) - 40, bottomY - 50, { width: 80, height: 80 });
            doc.font('Helvetica').fontSize(8).fillColor(darkGrey)
                .text(`Certificate ID: ${certData.id}`, (doc.page.width / 2) - 100, bottomY + 40, { width: 200, align: 'center' });

            doc.end();

        } catch (e) {
            reject(e);
        }
    });
};

/**
 * Create Certificate for Article
 * Internal function called by article controller or manually
 */
export const createAndSendCertificate = async (articleId: string) => {
    try {
        // Fetch article
        const article: any = await getDoc('content', articleId);
        if (!article) throw new Error('Article not found');

        // Fetch author
        const author: any = await getDoc('users', article.author_id);
        if (!author) throw new Error('Author not found');

        // Check if certificate already exists
        const existingCerts = await executeQuery('certificates' as any, [{ field: 'article_id', op: '==', value: articleId }]);
        if (existingCerts.length > 0) {
            logger.info(`Certificate already exists for article ${articleId}`);
            return existingCerts[0];
        }

        const certId = `MRX-AUTH-${Math.floor(1000 + Math.random() * 9000)}`;
        const issueDate = new Date();
        const formattedIssueDate = formatDate(issueDate);
        const publishedDate = article.publishedAt ? formatDate(article.publishedAt.toDate ? article.publishedAt.toDate() : new Date(article.publishedAt)) : formattedIssueDate;

        // Determine publication type (from metadata or default)
        let pubType = 'Article';
        if (article.metadata && article.metadata.publication_type) {
            pubType = article.metadata.publication_type;
        }

        const certData = {
            id: certId,
            authorName: author.name || 'Author',
            articleTitle: article.title,
            publicationType: pubType,
            publishedDate: publishedDate,
            issueDate: formattedIssueDate
        };

        // Generate PDF
        const pdfBuffer = await generateCertificatePDF(certData);

        // Save to Bucket
        const bucket = getStorageBucket();
        const filePath = `certificates/${articleId}/${certId}.pdf`;
        const file = bucket.file(filePath);
        await file.save(pdfBuffer, {
            metadata: { contentType: 'application/pdf' },
            resumable: false
        });

        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURI(filePath)}`;

        // Save to Firestore
        const certRecord = {
            id: certId,
            article_id: articleId,
            author_id: article.author_id,
            author_name: author.name,
            title: article.title,
            publication_type: pubType,
            issued_at: issueDate,
            storage_path: filePath,
            public_url: publicUrl,
            status: 'active'
        };

        // Cast 'certificates' as any to bypass strict literal check if not yet updated in helper
        await createDoc('certificates' as any, certRecord, certId);

        // Email to Author - WITH ATTACHMENT
        const subject = `Congratulations! Your Publication Certificate - ${certId}`;
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Publication Certificate</h2>
        <p>Dear ${author.name},</p>
        <p>Congratulations on successfully publishing your work titled <strong>"${article.title}"</strong> on MindRadiX.</p>
        <p>Please find your publication certificate attached to this email.</p>
        <p>You can also verify your certificate using the ID: <strong>${certId}</strong> or by scanning the QR code on the certificate.</p>
        <p>View/Download directly: <a href="${publicUrl}">Click Here</a></p>
        <br>
        <p>Best Regards,<br>MindRadiX Team</p>
      </div>
    `;

        await sendEmail(author.email, subject, html, [{
            filename: `Certificate-${certId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]);

        return certRecord;

    } catch (err) {
        logger.error('Error in createAndSendCertificate', err);
        throw err;
    }
};

/**
 * Controller: Get Certificate Verification
 * GET /api/certificates/:certId/verify
 */
export const verifyCertificate = async (req: Request, res: Response) => {
    try {
        const { certId } = req.params;
        const cert: any = await getDoc('certificates' as any, certId);

        if (!cert) {
            res.status(404).json({ status: 'error', message: 'Certificate not found' });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Certificate is valid',
            data: cert
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: 'Verification failed', error: err.message });
    }
};

/**
 * Controller: Generate Manual (Admin)
 * POST /api/admin/certificates/generate
 */
export const generateCertificateManually = async (req: Request, res: Response) => {
    try {
        const { articleId } = req.body;
        if (!articleId) {
            res.status(400).json({ message: 'articleId required' });
            return;
        }

        const cert = await createAndSendCertificate(articleId);
        res.status(200).json({ status: 'success', data: cert });
    } catch (e: any) {
        res.status(500).json({ status: 'error', message: e.message });
    }
}

/**
 * Controller: Get User Certificates
 * GET /api/certificates/my-certificates
 */
export const getMyCertificates = async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }
        const userId = req.user.userId;

        // Query certificates where author_id == userId
        const certs = await executeQuery('certificates' as any, [{ field: 'author_id', op: '==', value: userId }]);

        // Transform for frontend
        const data = certs.map((c: any) => ({
            id: c.id,
            title: c.title,
            publication_type: c.publication_type,
            issued_at: c.issued_at && c.issued_at.toDate ? c.issued_at.toDate() : (c.issued_at || new Date()),
            public_url: c.public_url
        }));

        res.status(200).json({ status: 'success', data: { certificates: data } });

    } catch (e: any) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
