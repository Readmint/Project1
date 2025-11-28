import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

// Allow TypeScript to use require in mixed module setups
declare const require: any;

/**
 * safeSign
 * - Detects the real `sign` function at runtime (handles ESM/CJS interop differences).
 * - Falls back to require('jsonwebtoken') if necessary.
 * - Throws a clear error if a sign function cannot be found.
 */
const safeSign = (payload: object | string | Buffer, secretOrPrivateKey: jwt.Secret, options?: jwt.SignOptions): string => {
  // try direct import shapes
  let signFn: Function | undefined = (jwt as any).sign ?? (jwt as any).default?.sign;

  // try require fallback (works in many CommonJS runtime environments)
  if (typeof signFn !== 'function') {
    try {
      const requiredJwt = require && typeof require === 'function' ? require('jsonwebtoken') : null;
      signFn = requiredJwt?.sign ?? requiredJwt?.default?.sign;
    } catch (reqErr) {
      // ignore — we'll handle below
    }
  }

  if (typeof signFn !== 'function') {
    // Provide useful debugging info for logs
    const jwtKeys = (() => {
      try { return Object.keys(jwt); } catch { return ['<unavailable>']; }
    })();
    const msg = `jsonwebtoken "sign" function not found. Detected jwt export keys: ${JSON.stringify(jwtKeys)}. ` +
                `Check that 'jsonwebtoken' is installed and that your bundler/runtime supports it.`;
    throw new Error(msg);
  }

  // Call the real sign function (preserve callback-less usage)
  return signFn(payload, secretOrPrivateKey, options);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password, name, role = 'reader' } = req.body;
    const db: any = getDatabase();

    // Check if user already exists
    let existingUser;
    if (db.collection) {
      // Firebase
      const userSnapshot = await db.collection('users').where('email', '==', email).get();
      existingUser = !userSnapshot.empty;
    } else {
      // MySQL
      const [rows]: any = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
      existingUser = rows.length > 0;
    }

    if (existingUser) {
      res.status(409).json({
        status: 'error',
        message: 'User already exists with this email'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData: any = {
      email,
      password: hashedPassword,
      name,
      role,
      profile_data: {},
      created_at: new Date()
    };

    let userId: string | number;
    if (db.collection) {
      // Firebase
      const userRef = await db.collection('users').add(userData);
      userId = userRef.id;
    } else {
      // MySQL
      const [result]: any = await db.execute(
        'INSERT INTO users (email, password, name, role, profile_data) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, name, role, JSON.stringify(userData.profile_data)]
      );
      userId = result.insertId;
    }

    // Generate JWT token - ensure secret present
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Ensure serializable userId for token payload
    const safeUserId = typeof userId === 'bigint' ? (userId as bigint).toString() : String(userId);

    // Use safeSign to avoid interop issues
    const token = safeSign(
      { userId: safeUserId, email, role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: userId,
          email,
          name,
          role
        }
      }
    });
  } catch (error: any) {
    logger.error('Registration error:', error && (error.stack || error.message || error));
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;
    const db: any = getDatabase();

    // Find user
    let user: any;
    if (db.collection) {
      // Firebase
      const userSnapshot = await db.collection('users').where('email', '==', email).get();
      if (userSnapshot.empty) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
        return;
      }
      user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
    } else {
      // MySQL
      const [rows]: any = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
        return;
      }
      user = rows[0];
      user.profile_data = JSON.parse(user.profile_data || '{}');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token - ensure secret present
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Ensure serializable userId for token payload
    const safeUserId = typeof user.id === 'bigint' ? user.id.toString() : String(user.id);

    // Use safeSign to avoid interop issues
    const token = safeSign(
      { userId: safeUserId, email: user.email, role: user.role },
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
    logger.error('Login error:', error && (error.stack || error.message || error));
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const db: any = getDatabase();

    let user: any;
    if (db.collection) {
      // Firebase
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }
      user = { id: userDoc.id, ...userDoc.data() };
      delete user.password;
    } else {
      // MySQL
      const [rows]: any = await db.execute(
        'SELECT id, email, name, role, profile_data, created_at FROM users WHERE id = ?',
        [userId]
      );
      if (rows.length === 0) {
        res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }
      user = rows[0];
      user.profile_data = JSON.parse(user.profile_data || '{}');
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error: any) {
    logger.error('Get current user error:', error && (error.stack || error.message || error));
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
