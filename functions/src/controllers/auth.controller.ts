import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { getCollection, executeQuery, createDoc, updateDoc, getDoc } from '../utils/firestore-helpers';

// Allow TypeScript to use require in mixed module setups
declare const require: any;

/* safeSign (same as you had) */
const safeSign = (payload: object | string | Buffer, secretOrPrivateKey: jwt.Secret, options?: jwt.SignOptions): string => {
  let signFn: Function | undefined = (jwt as any).sign ?? (jwt as any).default?.sign;

  if (typeof signFn !== 'function') {
    try {
      const requiredJwt = require && typeof require === 'function' ? require('jsonwebtoken') : null;
      signFn = requiredJwt?.sign ?? requiredJwt?.default?.sign;
    } catch (reqErr) {
      // ignore
    }
  }

  if (typeof signFn !== 'function') {
    const jwtKeys = (() => {
      try { return Object.keys(jwt); } catch { return ['<unavailable>']; }
    })();
    const msg = `jsonwebtoken "sign" function not found. Detected jwt export keys: ${JSON.stringify(jwtKeys)}. Check that 'jsonwebtoken' is installed and that your bundler/runtime supports it.`;
    throw new Error(msg);
  }

  return signFn(payload, secretOrPrivateKey, options);
};

// Generate random OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate reset token
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
    },
  });
};

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();
const resetTokenStore = new Map();

// Forgot password functions
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email } = req.body;

    // Firestore: Check if user exists
    const users = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);

    // For security, don't reveal if user exists or not
    if (users.length === 0) {
      res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, you will receive an OTP shortly'
      });
      return;
    }

    const user: any = users[0];

    // Check if email is verified
    if (!user.is_email_verified) {
      res.status(400).json({
        status: 'error',
        message: 'Please verify your email first before resetting password'
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, {
      otp,
      expiresAt,
      userId: user.id
    });

    // Send OTP email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - E-Magazine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>You requested to reset your password for your E-Magazine account.</p>
          <p>Your OTP for password reset is:</p>
          <div style="background: #f8fafc; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4F46E5; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">E-Magazine Team</p>
        </div>
      `,
    });

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to your email',
      data: { email }
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process request' });
  }
};

export const verifyResetOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email, otp } = req.body;

    // Get stored OTP
    const storedData = otpStore.get(email);

    if (!storedData) {
      res.status(400).json({ status: 'error', message: 'OTP not found or expired' });
      return;
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      res.status(400).json({ status: 'error', message: 'OTP has expired' });
      return;
    }

    if (storedData.otp !== otp) {
      res.status(400).json({ status: 'error', message: 'Invalid OTP' });
      return;
    }

    // OTP is valid - generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store reset token
    resetTokenStore.set(resetToken, {
      email,
      userId: storedData.userId,
      expiresAt: resetTokenExpiresAt
    });

    // Clear OTP
    otpStore.delete(email);

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully',
      data: {
        resetToken,
        email
      }
    });
  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to verify OTP' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email, resetToken, newPassword } = req.body;

    // Verify reset token
    const tokenData = resetTokenStore.get(resetToken);

    if (!tokenData) {
      res.status(400).json({ status: 'error', message: 'Invalid or expired reset token' });
      return;
    }

    if (Date.now() > tokenData.expiresAt) {
      resetTokenStore.delete(resetToken);
      res.status(400).json({ status: 'error', message: 'Reset token has expired' });
      return;
    }

    if (tokenData.email !== email) {
      res.status(400).json({ status: 'error', message: 'Invalid reset token for this email' });
      return;
    }

    // Update password in database
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await updateDoc('users', tokenData.userId, { password: hashedPassword });

    // Clear reset token
    resetTokenStore.delete(resetToken);

    // Send confirmation email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Successful - E-Magazine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset Successful</h2>
          <p>Your password has been successfully reset for your E-Magazine account.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">E-Magazine Team</p>
        </div>
      `,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reset password' });
  }
};

// Existing functions
export const sendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ status: 'error', message: 'Email is required' });
      return;
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with expiration
    otpStore.set(email, { otp, expiresAt });

    // Send email
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - E-Magazine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to E-Magazine!</h2>
          <p>Please use the following OTP to verify your email address:</p>
          <div style="background: #f8fafc; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4F46E5; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">E-Magazine Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Send verification email error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send verification email' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ status: 'error', message: 'Email and OTP are required' });
      return;
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      res.status(400).json({ status: 'error', message: 'OTP not found or expired' });
      return;
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      res.status(400).json({ status: 'error', message: 'OTP has expired' });
      return;
    }

    if (storedData.otp !== otp) {
      res.status(400).json({ status: 'error', message: 'Invalid OTP' });
      return;
    }

    // OTP is valid
    otpStore.delete(email);

    // Update user as verified in database
    // Find user by email first
    const users = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);
    if (users.length > 0) {
      await updateDoc('users', users[0].id, { is_email_verified: true });
    }

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to verify email' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email, password, name, role = 'reader', termsAccepted } = req.body;

    if (!termsAccepted) {
      res.status(400).json({ status: 'error', message: 'You must accept the Terms & Conditions' });
      return;
    }

    // Firestore: Check existing user
    const existingUsers = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);
    if (existingUsers.length > 0) {
      res.status(409).json({ status: 'error', message: 'User already exists with this email' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const termsAcceptedAt = new Date();

    // Create user with email not verified initially
    await createDoc('users', {
      email,
      password: hashedPassword,
      name,
      role,
      profile_data: {},
      is_email_verified: false,
      terms_accepted: true,
      terms_accepted_at: termsAcceptedAt
    }); // ID will be auto-generated

    // Send verification email
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt });

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - E-Magazine',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Welcome to ReadMint!</h2>
            <p>Please use the following OTP to verify your email address:</p>
            <div style="background: #f8fafc; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4F46E5; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">ReadMint Team</p>
          </div>
        `,
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully. Please check your email for verification OTP.',
        data: {
          email,
          requiresVerification: true
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still create user but mark as not verified
      res.status(201).json({
        status: 'success',
        message: 'User registered but verification email failed. Please try verifying later.',
        data: {
          email,
          requiresVerification: true
        }
      });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    logger.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Firestore fetch
    const users = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);

    if (users.length === 0) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    const user: any = users[0];

    // Check if email is verified
    if (!user.is_email_verified) {
      res.status(403).json({
        status: 'error',
        message: 'Please verify your email before logging in',
        requiresVerification: true
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = safeSign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    logger.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const oauth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, provider = 'google' } = req.body;

    if (!idToken) {
      res.status(400).json({ status: 'error', message: 'idToken is required' });
      return;
    }

    // Verify Firebase ID token
    let decoded: any;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err: any) {
      console.error('Firebase token verification failed:', err.message);
      res.status(401).json({
        status: 'error',
        message: 'Invalid Firebase ID token'
      });
      return;
    }

    const email = decoded.email;
    const name = decoded.name || decoded.displayName || email?.split('@')[0] || "User";
    const providerUid = decoded.uid;
    const picture = decoded.picture || null;
    const isEmailVerified = decoded.email_verified || false;

    if (!email) {
      res.status(400).json({ status: 'error', message: 'Firebase token does not contain email' });
      return;
    }

    // Find or create user in Firestore
    let user: any;
    const existingUsers = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);

    if (existingUsers.length > 0) {
      // User exists - update last login
      user = existingUsers[0];

      await updateDoc('users', user.id, { last_login: new Date() });
    } else {
      // Create new user with default role 'reader'
      const profileData = {
        providerUid,
        auth_provider: provider,
        ...(picture ? { avatar: picture } : {})
      };

      // Insert new user
      const newUser = await createDoc('users', {
        email,
        password: '', // No password for OAuth
        name,
        role: 'reader',
        profile_data: profileData,
        auth_provider: provider,
        is_email_verified: isEmailVerified,
        last_login: new Date()
      });

      user = newUser;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Generate JWT token
    const token = safeSign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(200).json({
      status: 'success',
      message: 'OAuth login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // Will be 'reader' for new OAuth users
          avatar: user.profile_data?.avatar || picture || null,
          isEmailVerified: user.is_email_verified || isEmailVerified
        }
      }
    });

  } catch (error: any) {
    console.error('OAuth error:', error);
    logger.error('OAuth error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during OAuth authentication'
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const user: any = await getDoc('users', userId);

    if (!user) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    // In Firestore we store profile_data as Object directly usually, but check if string
    if (typeof user.profile_data === 'string') {
      try { user.profile_data = JSON.parse(user.profile_data); } catch { }
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.profile_data?.avatar || null,
          isEmailVerified: user.is_email_verified,
          createdAt: user.created_at
        }
      }
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    logger.error('Get current user error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ status: 'error', message: 'Email is required' });
      return;
    }

    // Check if user exists
    const users = await executeQuery('users', [{ field: 'email', op: '==', value: email }]);

    if (users.length === 0) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    const user = users[0] as any;
    if (user.is_email_verified) {
      res.status(400).json({ status: 'error', message: 'Email is already verified' });
      return;
    }

    // Generate and send new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt });

    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - E-Magazine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Verify Your Email</h2>
          <p>Please use the following OTP to verify your email address:</p>
          <div style="background: #f8fafc; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4F46E5; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">E-Magazine Team</p>
        </div>
      `,
    });

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to send verification email' });
  }
};
