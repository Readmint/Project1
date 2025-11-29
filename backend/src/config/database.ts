import admin from 'firebase-admin';
import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let mysqlDb: any = null;
let firestoreDb: any = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Connect to Firebase Firestore (for authentication)
    if (process.env.FIREBASE_PROJECT_ID) {
      console.log('🔄 Initializing Firebase Firestore...');
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firestoreDb = admin.firestore();
      logger.info('Connected to Firebase Firestore');
      console.log('✅ Connected to Firebase Firestore');
    }

    // Connect to MySQL (for app data)
    if (process.env.DB_HOST) {
      console.log('🔄 Connecting to MySQL...');
      console.log('📊 Database:', process.env.DB_NAME);
      console.log('🏠 Host:', process.env.DB_HOST);
      console.log('👤 User:', process.env.DB_USER);

      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
      });

      mysqlDb = connection;
      logger.info('Connected to MySQL database');
      console.log('✅ Connected to MySQL database');
      
      // Test connection
      const [dbResult]: any = await mysqlDb.execute('SELECT DATABASE() as db_name');
      console.log('📋 Current database:', dbResult[0].db_name);
      
      // Initialize tables
      await initializeTables();
    }

    // Check if at least one database is connected
    if (!firestoreDb && !mysqlDb) {
      throw new Error('No database configuration found');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

const initializeTables = async (): Promise<void> => {
  console.log('🔄 Starting MySQL table initialization...');

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
    console.log('🔄 Creating users table...');
    await mysqlDb.execute(createUsersTable);
    console.log('✅ Users table created');

    console.log('🔄 Creating categories table...');
    await mysqlDb.execute(createCategoriesTable);
    console.log('✅ Categories table created');

    console.log('🔄 Creating content table...');
    await mysqlDb.execute(createContentTable);
    console.log('✅ Content table created');

    console.log('🔄 Creating subscription_plans table...');
    await mysqlDb.execute(createSubscriptionPlansTable);
    console.log('✅ Subscription plans table created');

    logger.info('MySQL database tables initialized successfully');
    console.log('🎉 All MySQL tables initialized successfully!');

    // Verify tables were created
    await verifyTableCreation();
  } catch (error) {
    console.error('❌ Error initializing MySQL tables:', error);
    logger.error('Error initializing MySQL tables:', error);
  }
};

const verifyTableCreation = async (): Promise<void> => {
  try {
    console.log('🔍 Verifying MySQL table creation...');
    const [tables]: any = await mysqlDb.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [process.env.DB_NAME]);

    const tableNames = tables.map((t: any) => t.TABLE_NAME);
    console.log('📋 MySQL tables found:', tableNames);

    const expectedTables = ['users', 'categories', 'content', 'subscription_plans'];
    const createdTables = expectedTables.filter(table => tableNames.includes(table));
    
    if (createdTables.length === expectedTables.length) {
      console.log('✅ All MySQL tables created successfully');
    } else {
      console.log('⚠️  Some MySQL tables might be missing');
    }
  } catch (error) {
    console.error('❌ Error verifying MySQL tables:', error);
  }
};

// Export both databases
export const getMySQLDatabase = (): any => {
  if (!mysqlDb) {
    throw new Error('MySQL database not initialized');
  }
  return mysqlDb;
};

export const getFirestoreDatabase = (): any => {
  if (!firestoreDb) {
    throw new Error('Firestore database not initialized');
  }
  return firestoreDb;
};

// Main getDatabase function - defaults to MySQL for your existing code
export const getDatabase = (): any => {
  // Return MySQL by default (for your existing auth controller)
  if (mysqlDb) {
    return mysqlDb;
  }
  throw new Error('No database initialized');
};

// Add a function to check both database statuses
export const checkDatabaseStatus = async (): Promise<any> => {
  const status: any = {};

  try {
    if (mysqlDb) {
      const [result]: any = await mysqlDb.execute('SELECT 1 as test');
      status.mysql = { connected: true, test: result[0].test };
    } else {
      status.mysql = { connected: false };
    }
  } catch (error) {
    status.mysql = { connected: false, error: error instanceof Error ? error.message : String(error) };
  }

  try {
    if (firestoreDb) {
      // Simple Firestore test
      await firestoreDb.collection('test').limit(1).get();
      status.firestore = { connected: true };
    } else {
      status.firestore = { connected: false };
    }
  } catch (error) {
    status.firestore = { connected: false, error: error instanceof Error ? error.message : String(error) };
  }

  return status;
};