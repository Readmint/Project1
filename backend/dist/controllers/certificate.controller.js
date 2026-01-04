"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCertificates = exports.generateCertificateManually = exports.verifyCertificate = exports.createAndSendCertificate = exports.generateCertificatePDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const firestore_helpers_1 = require("../utils/firestore-helpers");
const mailer_1 = require("../utils/mailer");
// Helper to format date
const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
};
/**
 * Generate Certificate PDF
 */
const generateCertificatePDF = async (certData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                layout: 'landscape',
                size: 'A4',
                margin: 50
            });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            // QR Code
            const verifyUrl = `${process.env.FRONTEND_URL || 'https://mindradix.com'}/verify-certificate?id=${certData.id}`;
            const qrDataUrl = await qrcode_1.default.toDataURL(verifyUrl);
            const qrImage = Buffer.from(qrDataUrl.split(',')[1], 'base64');
            // Colors
            const primaryColor = '#000000';
            const secondaryColor = '#444444';
            // Design based on image provided
            // Header: CERTIFICATE
            doc.font('Helvetica-Bold').fontSize(36).fillColor(primaryColor)
                .text('CERTIFICATE', { align: 'center' });
            doc.moveDown(0.5);
            // Subheader: This is to certify that
            doc.font('Helvetica').fontSize(14).fillColor(secondaryColor)
                .text('This is to certify that', { align: 'center' });
            doc.moveDown(1);
            // Author Name
            doc.font('Helvetica-Bold').fontSize(28).fillColor(primaryColor)
                .text(certData.authorName, { align: 'center' });
            doc.moveDown(0.5);
            // Successfully published text
            doc.font('Helvetica').fontSize(14).fillColor(secondaryColor)
                .text('has successfully published his/her original work entitled', { align: 'center' });
            doc.moveDown(1);
            // Article Title
            doc.font('Helvetica-BoldOblique').fontSize(22).fillColor(primaryColor)
                .text(`"${certData.articleTitle}"`, { align: 'center' });
            doc.moveDown(0.5);
            // "on MindRadiX"
            doc.font('Helvetica').fontSize(14).fillColor(secondaryColor)
                .text('on ', { continued: true, align: 'center' })
                .font('Helvetica-Bold').text('MindRadiX.');
            doc.moveDown(1.5);
            // Disclaimer text
            doc.font('Helvetica').fontSize(10).fillColor(secondaryColor)
                .text('The above-mentioned work has been published in accordance with the editorial and publication guidelines followed by MindRadiX.', { align: 'center' });
            doc.moveDown(2);
            // Publication Details Row
            const yPos = doc.y;
            doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor)
                .text(`Publication Type: ${certData.publicationType}`, 50, yPos, { width: 350, align: 'right' });
            doc.text(`Publication Date: ${certData.publishedDate}`, 450, yPos, { width: 350, align: 'left' });
            doc.moveDown(4);
            // Signatures & QR Row
            const bottomY = 450;
            // Editor signature (Left)
            doc.font('Helvetica').fontSize(10).fillColor(secondaryColor)
                .text('Signature of Editor-in-Chief', 100, bottomY);
            doc.font('Helvetica-Bold').text('Name: Dr. S. K. Singh', 100, bottomY + 15); // Placeholder name or configured
            // Authorized Signatory (Right)
            doc.font('Helvetica').fontSize(10).fillColor(secondaryColor)
                .text('Signature of Authorized Signatory', 550, bottomY);
            doc.font('Helvetica-Bold').text('Name: MindRadiX Admin', 550, bottomY + 15);
            // QR Code (Center)
            doc.image(qrImage, 350, bottomY - 30, { width: 100, height: 100 });
            doc.font('Helvetica').fontSize(9).text('QR Code (Scan to Verify)', 320, bottomY + 75, { width: 160, align: 'center' });
            doc.font('Helvetica-Bold').fontSize(9).text(`Certificate ID: ${certData.id}`, 320, bottomY + 90, { width: 160, align: 'center' });
            // Footer
            doc.font('Helvetica-Bold').fontSize(12).text('MindRadiX', 0, 530, { align: 'center' });
            doc.font('Helvetica').fontSize(10).text(`Date of Issue: ${certData.issueDate}`, 0, 545, { align: 'center' });
            doc.end();
        }
        catch (e) {
            reject(e);
        }
    });
};
exports.generateCertificatePDF = generateCertificatePDF;
/**
 * Create Certificate for Article
 * Internal function called by article controller or manually
 */
const createAndSendCertificate = async (articleId) => {
    try {
        // Fetch article
        const article = await (0, firestore_helpers_1.getDoc)('content', articleId);
        if (!article)
            throw new Error('Article not found');
        // Fetch author
        const author = await (0, firestore_helpers_1.getDoc)('users', article.author_id);
        if (!author)
            throw new Error('Author not found');
        // Check if certificate already exists
        const existingCerts = await (0, firestore_helpers_1.executeQuery)('certificates', [{ field: 'article_id', op: '==', value: articleId }]);
        if (existingCerts.length > 0) {
            logger_1.logger.info(`Certificate already exists for article ${articleId}`);
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
        const pdfBuffer = await (0, exports.generateCertificatePDF)(certData);
        // Save to Bucket
        const bucket = (0, database_1.getStorageBucket)();
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
        await (0, firestore_helpers_1.createDoc)('certificates', certRecord, certId);
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
        await (0, mailer_1.sendEmail)(author.email, subject, html, [{
                filename: `Certificate-${certId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]);
        return certRecord;
    }
    catch (err) {
        logger_1.logger.error('Error in createAndSendCertificate', err);
        throw err;
    }
};
exports.createAndSendCertificate = createAndSendCertificate;
/**
 * Controller: Get Certificate Verification
 * GET /api/certificates/:certId/verify
 */
const verifyCertificate = async (req, res) => {
    try {
        const { certId } = req.params;
        const cert = await (0, firestore_helpers_1.getDoc)('certificates', certId);
        if (!cert) {
            return res.status(404).json({ status: 'error', message: 'Certificate not found' });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Certificate is valid',
            data: cert
        });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: 'Verification failed', error: err.message });
    }
};
exports.verifyCertificate = verifyCertificate;
/**
 * Controller: Generate Manual (Admin)
 * POST /api/admin/certificates/generate
 */
const generateCertificateManually = async (req, res) => {
    try {
        const { articleId } = req.body;
        if (!articleId)
            return res.status(400).json({ message: 'articleId required' });
        const cert = await (0, exports.createAndSendCertificate)(articleId);
        res.status(200).json({ status: 'success', data: cert });
    }
    catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
exports.generateCertificateManually = generateCertificateManually;
/**
 * Controller: Get User Certificates
 * GET /api/certificates/my-certificates
 */
const getMyCertificates = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        const userId = req.user.userId;
        // Query certificates where author_id == userId
        const certs = await (0, firestore_helpers_1.executeQuery)('certificates', [{ field: 'author_id', op: '==', value: userId }]);
        // Transform for frontend
        const data = certs.map((c) => ({
            id: c.id,
            title: c.title,
            publication_type: c.publication_type,
            issued_at: c.issued_at && c.issued_at.toDate ? c.issued_at.toDate() : (c.issued_at || new Date()),
            public_url: c.public_url
        }));
        res.status(200).json({ status: 'success', data: { certificates: data } });
    }
    catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
exports.getMyCertificates = getMyCertificates;
//# sourceMappingURL=certificate.controller.js.map