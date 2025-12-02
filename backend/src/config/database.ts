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

  // NEW: Payment Orders Table for PayU
  const createPaymentOrdersTable = `
    CREATE TABLE IF NOT EXISTS payment_orders (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      txnid VARCHAR(255) NOT NULL UNIQUE,
      plan_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      email VARCHAR(255),
      phone VARCHAR(20),
      firstname VARCHAR(100),
      productinfo VARCHAR(255) DEFAULT 'Magazine Subscription',
      status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
      hash VARCHAR(255),
      payment_date DATETIME,
      error_message TEXT,
      udf1 VARCHAR(255),
      udf2 VARCHAR(255),
      udf3 VARCHAR(255),
      udf4 VARCHAR(255),
      udf5 VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_txnid (txnid),
      INDEX idx_created_at (created_at)
    )
  `;

  // NEW: User Subscriptions Table
  const createUserSubscriptionsTable = `
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(255) NOT NULL,
      plan_id VARCHAR(255) NOT NULL,
      status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
      payment_txn_id VARCHAR(255),
      amount DECIMAL(10,2),
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_end_date (end_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
    )
  `;

  // NEW: Payment Transactions Log Table
  const createPaymentTransactionsTable = `
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      txnid VARCHAR(255) NOT NULL,
      payment_id VARCHAR(255),
      payment_mode VARCHAR(50),
      bank_ref_num VARCHAR(255),
      bankcode VARCHAR(50),
      card_type VARCHAR(50),
      card_name VARCHAR(100),
      card_num VARCHAR(50),
      card_last4 VARCHAR(4),
      card_network VARCHAR(50),
      mihpayid VARCHAR(255),
      request_json JSON,
      response_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_txnid (txnid),
      INDEX idx_payment_id (payment_id)
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

    console.log('🔄 Creating payment_orders table...');
    await mysqlDb.execute(createPaymentOrdersTable);
    console.log('✅ Payment orders table created');

    console.log('🔄 Creating user_subscriptions table...');
    await mysqlDb.execute(createUserSubscriptionsTable);
    console.log('✅ User subscriptions table created');

    console.log('🔄 Creating payment_transactions table...');
    await mysqlDb.execute(createPaymentTransactionsTable);
    console.log('✅ Payment transactions table created');

    // Insert default subscription plans if table is empty
    await seedDefaultPlans();

    logger.info('MySQL database tables initialized successfully');
    console.log('🎉 All MySQL tables initialized successfully!');

    // Verify tables were created
    await verifyTableCreation();
  } catch (error) {
    console.error('❌ Error initializing MySQL tables:', error);
    logger.error('Error initializing MySQL tables:', error);
  }
};

// NEW: Seed default subscription plans
const seedDefaultPlans = async (): Promise<void> => {
  try {
    console.log('🌱 Checking for default subscription plans...');
    
    // Check if plans already exist
    const [existingPlans]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM subscription_plans');
    
    if (existingPlans[0].count === 0) {
      console.log('🌱 Seeding default subscription plans...');
      
      const defaultPlans = [
        {
          name: 'Free Plan',
          description: 'Basic access with limited features',
          price_monthly: 0,
          price_yearly: 0,
          features: JSON.stringify([
            'Limited reading access',
            'Basic content',
            'Ad-supported',
            'Community access'
          ]),
          duration: 'monthly'
        },
        {
          name: 'Standard Plan',
          description: 'Full access to most magazines',
          price_monthly: 9.99,
          price_yearly: 99.99,
          features: JSON.stringify([
            'Most magazines unlocked',
            'Ad-free reading',
            'Offline access',
            'Unlimited bookmarks',
            'Download for offline reading',
            'Email support'
          ]),
          duration: 'monthly'
        },
        {
          name: 'Premium Plan',
          description: 'Complete unlimited access',
          price_monthly: 19.99,
          price_yearly: 199.99,
          features: JSON.stringify([
            'All magazines unlocked',
            'Ad-free experience',
            'Exclusive content',
            'Early access',
            'Priority support',
            'Certificate of achievements',
            'Monthly webinars'
          ]),
          duration: 'monthly'
        }
      ];

      for (const plan of defaultPlans) {
        await mysqlDb.execute(
          `INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, duration, created_at)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())`,
          [plan.name, plan.description, plan.price_monthly, plan.price_yearly, plan.features, plan.duration]
        );
      }
      
      console.log('✅ Default subscription plans seeded');
      
      // Verify seeding
      const [plansCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM subscription_plans');
      console.log(`📊 Total subscription plans: ${plansCount[0].count}`);
    } else {
      console.log(`📊 Subscription plans already exist (${existingPlans[0].count} plans found)`);
    }
  } catch (error) {
    console.error('❌ Error seeding default plans:', error);
    logger.error('Error seeding default plans:', error);
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

    // Updated expected tables list
    const expectedTables = [
      'users', 
      'categories', 
      'content', 
      'subscription_plans',
      'payment_orders',
      'user_subscriptions',
      'payment_transactions'
    ];
    
    const createdTables = expectedTables.filter(table => tableNames.includes(table));
    
    console.log('📊 Table creation status:');
    expectedTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (missing)`);
      }
    });
    
    if (createdTables.length === expectedTables.length) {
      console.log('✅ All MySQL tables created successfully');
    } else {
      console.log(`⚠️  ${expectedTables.length - createdTables.length} MySQL tables might be missing`);
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
      
      // Check table counts
      const [usersCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM users');
      const [plansCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM subscription_plans');
      const [ordersCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM payment_orders');
      const [subscriptionsCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM user_subscriptions');
      
      status.mysql.table_counts = {
        users: usersCount[0].count,
        subscription_plans: plansCount[0].count,
        payment_orders: ordersCount[0].count,
        user_subscriptions: subscriptionsCount[0].count
      };
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

// NEW: Function to get database schema info
export const getDatabaseSchema = async (): Promise<any> => {
  if (!mysqlDb) {
    throw new Error('MySQL database not initialized');
  }

  try {
    const [tables]: any = await mysqlDb.execute(`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS,
        DATA_LENGTH,
        INDEX_LENGTH,
        CREATE_TIME,
        UPDATE_TIME
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME]);

    const schemaInfo = [];
    
    for (const table of tables) {
      const [columns]: any = await mysqlDb.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY,
          EXTRA
        FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = ?
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME, table.TABLE_NAME]);

      schemaInfo.push({
        table_name: table.TABLE_NAME,
        table_rows: table.TABLE_ROWS,
        data_length: table.DATA_LENGTH,
        index_length: table.INDEX_LENGTH,
        columns: columns
      });
    }

    return schemaInfo;
  } catch (error) {
    console.error('Error getting database schema:', error);
    throw error;
  }
};