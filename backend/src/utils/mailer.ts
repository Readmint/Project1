import nodemailer from 'nodemailer';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    // Init transporter only when needed (after dotenv is likely loaded)
    transporter = nodemailer.createTransport({
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

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.warn('Email credentials not found in environment variables. Email not sent.');
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

    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};
