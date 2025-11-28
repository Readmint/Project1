import admin from 'firebase-admin';
import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let db: any = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      // Firebase Configuration
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      db = admin.firestore();
      logger.info('Connected to Firebase Firestore');
    } else if (process.env.DB_HOST) {
      // MySQL Configuration
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
      });

      db = connection;
      logger.info('Connected to MySQL database');
      
      // Initialize tables
      await initializeTables();
    } else {
      throw new Error('No database configuration found');
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

const initializeTables = async (): Promise<void> => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('reader', 'author', 'reviewer', 'editor', 'content_manager', 'admin') DEFAULT 'reader',
      profile_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      parent_category_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_category_id) REFERENCES categories(id)
    )
  `;

  const createContentTable = `
    CREATE TABLE IF NOT EXISTS content (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      title VARCHAR(500) NOT NULL,
      author_id VARCHAR(36) NOT NULL,
      category_id VARCHAR(36) NOT NULL,
      content TEXT,
      status ENUM('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'published') DEFAULT 'draft',
      featured BOOLEAN DEFAULT FALSE,
      trending_score INT DEFAULT 0,
      likes_count INT DEFAULT 0,
      reads_count INT DEFAULT 0,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `;

  const createSubscriptionPlansTable = `
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price_monthly DECIMAL(10,2),
      price_yearly DECIMAL(10,2),
      features JSON,
      duration ENUM('monthly', 'yearly') DEFAULT 'monthly',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await db.execute(createUsersTable);
    await db.execute(createCategoriesTable);
    await db.execute(createContentTable);
    await db.execute(createSubscriptionPlansTable);
    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.error('Error initializing tables:', error);
  }
};

export const getDatabase = (): any => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};