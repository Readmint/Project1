import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import admin from 'firebase-admin';

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

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email, password, name, role = 'reader' } = req.body;
    const db: any = getDatabase();

    let existingUser;
    if (db.collection) {
      const userSnapshot = await db.collection('users').where('email', '==', email).get();
      existingUser = !userSnapshot.empty;
    } else {
      const [rows]: any = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
      existingUser = rows.length > 0;
    }

    if (existingUser) {
      res.status(409).json({ status: 'error', message: 'User already exists with this email' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

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
      const userRef = await db.collection('users').add(userData);
      userId = userRef.id;
    } else {
      const [result]: any = await db.execute(
        'INSERT INTO users (email, password, name, role, profile_data) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, name, role, JSON.stringify(userData.profile_data)]
      );
      // For UUID, we need to get the user by email since insertId doesn't work with UUID
      const [newUser]: any = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
      userId = newUser[0].id;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const safeUserId = typeof userId === 'bigint' ? (userId as bigint).toString() : String(userId);

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
    console.error('Registration error:', error);
    logger.error('Registration error:', error && (error.stack || error.message || error));
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== LOGIN START ===');
    console.log('Request body:', { ...req.body, password: '[HIDDEN]' });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    const db: any = getDatabase();
    console.log('Database type:', db.execute ? 'MySQL' : 'Firestore');

    let user: any;
    if (db.collection) {
      console.log('Searching user in Firestore...');
      const userSnapshot = await db.collection('users').where('email', '==', email).get();
      if (userSnapshot.empty) {
        console.log('User not found in Firestore');
        res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        return;
      }
      user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
      console.log('User found in Firestore:', { id: user.id, email: user.email });
    } else {
      console.log('Searching user in MySQL...');
      const [rows]: any = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      console.log('MySQL query result count:', rows.length);
      
      if (rows.length === 0) {
        console.log('User not found in MySQL');
        res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        return;
      }
      user = rows[0];
      console.log('User found in MySQL:', { id: user.id, email: user.email });
      
      try {
        user.profile_data = JSON.parse(user.profile_data || '{}');
        console.log('Profile data parsed successfully');
      } catch (parseError) {
        console.log('Error parsing profile_data, using empty object');
        user.profile_data = {};
      }
    }

    console.log('Checking password...');
    console.log('Stored hashed password exists:', !!user.password);
    
    if (!user.password) {
      console.log('No password found for user - might be OAuth user');
      res.status(401).json({ status: 'error', message: 'Invalid credentials - please use social login' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is missing');
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const safeUserId = typeof user.id === 'bigint' ? user.id.toString() : String(user.id);
    console.log('User ID for JWT:', safeUserId);

    console.log('Generating JWT token...');
    const token = safeSign(
      { userId: safeUserId, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    console.log('=== LOGIN SUCCESS ===');
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
    console.error('=== LOGIN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    logger.error('Login error:', error && (error.stack || error.message || error));
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const oauth = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== OAUTH START ===');
    console.log('Request body:', { ...req.body, idToken: req.body.idToken ? '[HIDDEN]' : 'MISSING' });

    // Check for validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      res.status(400).json({ 
        status: 'error', 
        message: 'Validation failed', 
        errors: errors.array() 
      });
      return;
    }

    const { idToken, provider = 'google' } = req.body;
    
    if (!idToken) {
      console.log('Missing idToken');
      res.status(400).json({ status: 'error', message: 'idToken is required' });
      return;
    }

    console.log('OAuth attempt with provider:', provider);

    // Ensure admin SDK is initialized
    if (!admin?.auth) {
      console.error('Firebase Admin SDK not initialized');
      logger.error("Firebase admin SDK is not initialized.");
      res.status(500).json({ status: 'error', message: 'Server misconfiguration: Firebase not initialized' });
      return;
    }

    // Verify the id token with enhanced error handling
    let decoded: any;
    try {
      console.log('Verifying Firebase ID token...');
      decoded = await admin.auth().verifyIdToken(idToken);
      console.log('Firebase token verified successfully:', { 
        uid: decoded.uid, 
        email: decoded.email,
        email_verified: decoded.email_verified 
      });
    } catch (err: any) {
      console.error('Firebase token verification failed:', err.message);
      logger.error("Failed to verify Firebase ID token:", err);
      res.status(401).json({ 
        status: 'error', 
        message: 'Invalid Firebase ID token',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
      return;
    }

    const email = decoded.email;
    const name = decoded.name || decoded.displayName || email?.split('@')[0] || "";
    const providerUid = decoded.uid;
    const picture = decoded.picture || decoded.avatar || null;
    const isEmailVerified = decoded.email_verified || false;

    if (!email) {
      console.log('Firebase token missing email');
      res.status(400).json({ status: 'error', message: 'Firebase token does not contain email' });
      return;
    }

    console.log('Processing OAuth user:', { email, name, providerUid });

    const db: any = getDatabase();
    console.log('Database type:', db.execute ? 'MySQL' : 'Firestore');

    // Find or create user in DB with enhanced user data
    let user: any;
    if (db.collection) {
      // Firestore
      console.log('Searching for user in Firestore...');
      const userSnapshot = await db.collection('users').where('email', '==', email).get();
      if (!userSnapshot.empty) {
        console.log('Existing user found in Firestore');
        user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
        
        // Update last login and any new fields
        console.log('Updating existing user in Firestore...');
        await db.collection('users').doc(user.id).update({
          last_login: new Date(),
          ...(picture && !user.avatar ? { avatar: picture } : {}),
          ...(!user.auth_provider ? { auth_provider: provider } : {})
        });
        
        // Refresh user data
        const updatedDoc = await db.collection('users').doc(user.id).get();
        user = { id: updatedDoc.id, ...updatedDoc.data() };
        console.log('User updated successfully:', { userId: user.id, email });
      } else {
        // Create new user
        console.log('Creating new user in Firestore...');
        const userData = {
          email,
          name,
          role: 'reader',
          profile_data: { 
            providerUid,
            auth_provider: provider,
            ...(picture ? { avatar: picture } : {})
          },
          auth_provider: provider,
          ...(picture ? { avatar: picture } : {}),
          is_email_verified: isEmailVerified,
          created_at: new Date(),
          last_login: new Date()
        };
        const ref = await db.collection('users').add(userData);
        user = { id: ref.id, ...userData };
        console.log('New user created via OAuth:', { userId: user.id, email, provider });
      }
    } else {
      // MySQL
      console.log('Searching for user in MySQL...');
      const [rows]: any = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      console.log('MySQL query result count:', rows.length);
      
      if (rows.length > 0) {
        console.log('Existing user found in MySQL');
        user = rows[0];
        user.profile_data = JSON.parse(user.profile_data || '{}');
        
        // Update last login
        console.log('Updating existing user in MySQL...');
        const profileData = { ...user.profile_data, providerUid };
        if (picture && !user.profile_data.avatar) {
          profileData.avatar = picture;
        }
        if (!user.profile_data.auth_provider) {
          profileData.auth_provider = provider;
        }
        
        await db.execute(
          'UPDATE users SET last_login = ?, profile_data = ? WHERE id = ?',
          [new Date(), JSON.stringify(profileData), user.id]
        );
        
        // Refresh user data
        const [updatedRows]: any = await db.execute('SELECT * FROM users WHERE id = ?', [user.id]);
        user = updatedRows[0];
        user.profile_data = JSON.parse(user.profile_data || '{}');
        console.log('User updated successfully:', { userId: user.id, email });
      } else {
        // Create new user
        console.log('Creating new user in MySQL...');
        const profileData = { 
          providerUid,
          auth_provider: provider,
          ...(picture ? { avatar: picture } : {})
        };
        
        await db.execute(
          'INSERT INTO users (email, password, name, role, profile_data, auth_provider, is_email_verified, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [email, '', name, 'reader', JSON.stringify(profileData), provider, isEmailVerified, new Date()]
        );
        
        // Get the newly created user
        const [newRows]: any = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        user = newRows[0];
        user.profile_data = JSON.parse(user.profile_data || '{}');
        console.log('New user created via OAuth:', { userId: user.id, email, provider });
      }
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is missing');
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const safeUserId = typeof user.id === 'bigint' ? user.id.toString() : String(user.id);
    console.log('User ID for JWT:', safeUserId);

    console.log('Generating JWT token for OAuth...');
    const token = safeSign(
      { userId: safeUserId, email: user.email, role: user.role || 'reader' },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    console.log('=== OAUTH SUCCESS ===');
    res.status(200).json({
      status: 'success',
      message: 'OAuth login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || name,
          role: user.role || 'reader',
          avatar: user.avatar || user.profile_data?.avatar || picture || null,
          isEmailVerified: user.is_email_verified || isEmailVerified
        }
      }
    });

  } catch (error: any) {
    console.error('=== OAUTH ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    logger.error('OAuth error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error during OAuth authentication',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const db: any = getDatabase();

    let user: any;
    if (db.collection) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        res.status(404).json({ status: 'error', message: 'User not found' });
        return;
      }
      user = { id: userDoc.id, ...userDoc.data() };
      delete user.password;
    } else {
      const [rows]: any = await db.execute('SELECT id, email, name, role, profile_data, created_at FROM users WHERE id = ?', [userId]);
      if (rows.length === 0) {
        res.status(404).json({ status: 'error', message: 'User not found' });
        return;
      }
      user = rows[0];
      user.profile_data = JSON.parse(user.profile_data || '{}');
    }

    res.status(200).json({ status: 'success', data: { user } });
  } catch (error: any) {
    console.error('Get current user error:', error);
    logger.error('Get current user error:', error && (error.stack || error.message || error));
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};