"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("./logger");
let transporter = null;
const getTransporter = () => {
    if (!transporter) {
        // Init transporter only when needed (after dotenv is likely loaded)
        transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        // Debug log once
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASSWORD;
        console.log(`[MAILER INIT] Email Configured: User=${!!emailUser}, Pass=${!!emailPass ? 'Yes' : 'No'}`);
    }
    return transporter;
};
const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            logger_1.logger.warn('Email credentials not found in environment variables. Email not sent.');
            console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
            return false;
        }
        const mailer = getTransporter();
        const info = await mailer.sendMail({
            from: `"ReadMint Team" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        logger_1.logger.info(`Email sent: ${info.messageId}`);
        return true;
    }
    catch (error) {
        logger_1.logger.error('Error sending email:', error);
        return false;
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=mailer.js.map