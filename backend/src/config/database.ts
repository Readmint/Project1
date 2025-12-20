// src/config/database.ts
import admin from 'firebase-admin';
import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let mysqlDb: any = null;
let firestoreDb: any = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Connect to Firebase Firestore (for authentication / storage bucket)
    if (process.env.FIREBASE_PROJECT_ID) {
      console.log('🔄 Initializing Firebase Firestore...');
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });

      firestoreDb = admin.firestore();
      logger.info('Connected to Firebase Firestore');
      console.log('✅ Connected to Firebase Firestore');
      console.log('📦 Storage bucket:', process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`);
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
        port: parseInt(process.env.DB_PORT || '3306', 10),
      });

      mysqlDb = connection;
      logger.info('Connected to MySQL database');
      console.log('✅ Connected to MySQL database');

      // Test connection
      const [dbResult]: any = await mysqlDb.execute('SELECT DATABASE() as db_name');
      console.log('📋 Current database:', dbResult && dbResult[0] ? dbResult[0].db_name : '(unknown)');

      // Initialize tables (creates all necessary tables including editor-related ones)
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

  /**
   * Core tables
   *
   * NOTE: Some CREATE TABLE statements use UUID() or JSON functions
   * which depend on your MySQL / MariaDB version. Adjust if necessary.
   */

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('reader', 'author', 'reviewer', 'editor', 'content_manager', 'admin', 'partner') DEFAULT 'reader',
      partner_id VARCHAR(36),
      profile_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_partner_id (partner_id)
    )
  `;

  const createPartnersTable = `
    CREATE TABLE IF NOT EXISTS partners (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) DEFAULT 'university',
      admin_user_id VARCHAR(36),
      website VARCHAR(500),
      logo_url VARCHAR(1000),
      settings JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_partner_admin (admin_user_id)
      -- Foreign key constraint added later to separate dependency
    )
  `;

  const createPartnerEventsTable = `
    CREATE TABLE IF NOT EXISTS partner_events (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      partner_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATETIME,
      end_date DATETIME,
      status ENUM('upcoming', 'active', 'ended', 'archived') DEFAULT 'upcoming',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
      INDEX idx_partner_events (partner_id),
      INDEX idx_event_status (status)
    )
  `;

  const createAuthorsTable = `
    CREATE TABLE IF NOT EXISTS authors (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL UNIQUE,
      display_name VARCHAR(255),
      profile_photo_url VARCHAR(500),
      location VARCHAR(255),
      bio TEXT,
      legal_name VARCHAR(255),
      qualifications TEXT,
      specialty VARCHAR(255),
      tags JSON,
      social_links JSON,
      payout_details JSON,
      is_verified BOOLEAN DEFAULT FALSE,
      joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_display_name (display_name),
      INDEX idx_specialty (specialty),
      INDEX idx_is_verified (is_verified),
      INDEX idx_joined_date (joined_date)
    )
  `;

  const createAuthorStatsTable = `
    CREATE TABLE IF NOT EXISTS author_stats (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      author_id VARCHAR(36) NOT NULL UNIQUE,
      articles_published INT DEFAULT 0,
      total_views INT DEFAULT 0,
      certificates_earned INT DEFAULT 0,
      total_earnings DECIMAL(10,2) DEFAULT 0.00,
      monthly_earnings DECIMAL(10,2) DEFAULT 0.00,
      author_rank INT DEFAULT 0,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
      INDEX idx_author_id (author_id),
      INDEX idx_rank (author_rank),
      INDEX idx_total_earnings (total_earnings DESC),
      INDEX idx_articles_published (articles_published DESC),
      INDEX idx_last_updated (last_updated DESC)
    )
  `;

  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      category_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      slug VARCHAR(255) UNIQUE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_is_active (is_active),
      INDEX idx_slug (slug)
    )
  `;

  const createContentTable = `
    CREATE TABLE IF NOT EXISTS content (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      title VARCHAR(500) NOT NULL,
      author_id VARCHAR(36) NOT NULL,
      category_id VARCHAR(36),
      event_id VARCHAR(36),
      content LONGTEXT,
      language VARCHAR(50) DEFAULT 'English',
      status ENUM('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'published', 'rejected') DEFAULT 'draft',
      visibility ENUM('public', 'partner', 'private') DEFAULT 'public',
      featured BOOLEAN DEFAULT FALSE,
      trending_score INT DEFAULT 0,
      likes_count INT DEFAULT 0,
      reads_count INT DEFAULT 0,
      reads_count INT DEFAULT 0,
      metadata JSON,
      co_authors JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(category_id),
      FOREIGN KEY (event_id) REFERENCES partner_events(id) ON DELETE SET NULL,
      INDEX idx_author_status (author_id, status),
      INDEX idx_status (status),
      INDEX idx_language (language),
      INDEX idx_created_at (created_at),
      INDEX idx_visibility (visibility),
      INDEX idx_event_content (event_id)
    )
  `;

  const createAttachmentsTable = `
    CREATE TABLE IF NOT EXISTS attachments (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      article_id VARCHAR(36) NOT NULL,
      storage_path VARCHAR(1000) NOT NULL,
      public_url VARCHAR(2000) NULL,
      filename VARCHAR(512),
      mime_type VARCHAR(100),
      size_bytes BIGINT,
      uploaded_by VARCHAR(36),
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE,
      INDEX idx_article_id (article_id),
      INDEX idx_uploaded_by (uploaded_by)
    )
  `;

  const createPlagiarismReportsTable = `
    CREATE TABLE IF NOT EXISTS plagiarism_reports (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      article_id VARCHAR(36) NOT NULL,
      run_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      similarity_summary JSON NULL,
      report_storage_path VARCHAR(1000),
      report_public_url VARCHAR(2000),
      status ENUM('pending','completed','failed') DEFAULT 'completed',
      notes TEXT,
      FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE,
      INDEX idx_article_id_plag (article_id),
      INDEX idx_run_by (run_by)
    )
  `;

  const createWorkflowEventsTable = `
    CREATE TABLE IF NOT EXISTS workflow_events (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      article_id VARCHAR(36) NOT NULL,
      actor_id VARCHAR(36) NULL,
      from_status ENUM('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'published', 'rejected') NULL,
      to_status ENUM('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'published', 'rejected') NOT NULL,
      note TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE,
      INDEX idx_wf_article (article_id),
      INDEX idx_wf_actor (actor_id)
    )
  `;

  const createReviewsTable = `
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      article_id VARCHAR(36) NOT NULL,
      reviewer_id VARCHAR(36) NOT NULL,
      summary TEXT,
      details LONGTEXT,
      decision ENUM('approve','request_changes','reject') DEFAULT 'request_changes',
      similarity_score FLOAT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE,
      INDEX idx_review_article (article_id),
      INDEX idx_reviewer_id (reviewer_id)
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

  const createReadersTable = `
    CREATE TABLE IF NOT EXISTS readers (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL UNIQUE,
      subscription_status ENUM('free','active','expired','cancelled') DEFAULT 'free',
      preferences JSON,
      saved_items_count INT DEFAULT 0,
      likes_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id_reader (user_id),
      INDEX idx_subscription_status (subscription_status)
    )
  `;

  const createReadingProgressTable = `
    CREATE TABLE IF NOT EXISTS reading_progress (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      content_id VARCHAR(36) NOT NULL,
      last_read_position VARCHAR(255),
      percent_read INT DEFAULT 0,
      last_opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_user_content (user_id, content_id),
      INDEX idx_user_progress (user_id),
      INDEX idx_content_progress (content_id),
      INDEX idx_last_opened_at (last_opened_at)
    )
  `;

  const createBookmarksTable = `
    CREATE TABLE IF NOT EXISTS user_bookmarks (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      content_id VARCHAR(36) NOT NULL,
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      note TEXT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_user_content_bookmark (user_id, content_id),
      INDEX idx_user_bookmarks (user_id),
      INDEX idx_content_bookmarks (content_id)
    )
  `;

  const createLikesTable = `
    CREATE TABLE IF NOT EXISTS user_likes (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      content_id VARCHAR(36) NOT NULL,
      liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_user_content_like (user_id, content_id),
      INDEX idx_user_likes (user_id),
      INDEX idx_content_likes (content_id)
    )
  `;

  const createRecommendationsTable = `
    CREATE TABLE IF NOT EXISTS recommendations (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      algorithm_version VARCHAR(50),
      items JSON,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_recommendations (user_id),
      INDEX idx_generated_at (generated_at)
    )
  `;

  // -------------------------
  // Editor-related tables
  // -------------------------
  const createEditorsTable = `
    CREATE TABLE IF NOT EXISTS editors (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL UNIQUE,
      display_name VARCHAR(255),
      profile_photo_url VARCHAR(1000),
      resume_url VARCHAR(2000),
      resume_name VARCHAR(512),
      fields JSON,
      experience_months INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_editor_user (user_id),
      INDEX idx_is_active_editor (is_active)
    )
  `;

  const createEditorAssignmentsTable = `
    CREATE TABLE IF NOT EXISTS editor_assignments (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      editor_id VARCHAR(36) NOT NULL,
      article_id VARCHAR(36) NOT NULL,
      assigned_by VARCHAR(36),
      assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      due_date TIMESTAMP NULL,
      priority ENUM('High','Medium','Mid','Low') DEFAULT 'Medium',
      status ENUM('assigned','in_progress','completed','cancelled') DEFAULT 'assigned',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (editor_id) REFERENCES editors(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE,
      INDEX idx_editor_assignment (editor_id),
      INDEX idx_article_assignment (article_id),
      INDEX idx_status_assignment (status)
    )
  `;

  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        link VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notif_user (user_id),
        INDEX idx_notif_read (is_read)
    )
  `;

  const createCommunicationsTable = `
    CREATE TABLE IF NOT EXISTS communications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        sender_id VARCHAR(36),
        receiver_id VARCHAR(36),
        message TEXT,
        type ENUM('assignment', 'message', 'alert', 'system') DEFAULT 'message',
        entity_type VARCHAR(50),
        entity_id VARCHAR(36),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_comm_sender (sender_id),
        INDEX idx_comm_receiver (receiver_id),
        INDEX idx_comm_entity (entity_type, entity_id)
    )
  `;

  const createEditorActivityTable = `
    CREATE TABLE IF NOT EXISTS editor_activity (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      editor_id VARCHAR(36) NULL,
      article_id VARCHAR(36) NULL,
      action VARCHAR(100) NOT NULL,
      action_detail JSON,
      ip_address VARCHAR(50),
      user_agent VARCHAR(1000),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (editor_id) REFERENCES editors(id) ON DELETE SET NULL,
      FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE SET NULL,
      INDEX idx_editor_activity (editor_id),
      INDEX idx_article_activity (article_id)
    )
  `;

  const createVersionsTable = `
    CREATE TABLE IF NOT EXISTS versions (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      article_id VARCHAR(36) NOT NULL,
      editor_id VARCHAR(36) NULL,
      title VARCHAR(500),
      content LONGTEXT,
      meta JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      restored_from VARCHAR(36) NULL,
      INDEX idx_version_article (article_id),
      INDEX idx_version_editor (editor_id)
    )
  `;

  const createReviewerAssignmentsTable = `
    CREATE TABLE IF NOT EXISTS reviewer_assignments (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      reviewer_id VARCHAR(36) NOT NULL,
      article_id VARCHAR(36) NOT NULL,
      assigned_by VARCHAR(36),
      assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      due_date TIMESTAMP NULL,
      status ENUM('assigned','in_progress','completed','declined','cancelled') DEFAULT 'assigned',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE,
      INDEX idx_reviewer_assignment (reviewer_id),
      INDEX idx_article_rev_assignment (article_id),
      INDEX idx_status_rev_assignment (status)
    )
  `;

  try {
    // Core
    console.log('🔄 Creating users table...');
    await mysqlDb.execute(createUsersTable);
    console.log('✅ Users table created');

    console.log('🔄 Creating authors table...');
    await mysqlDb.execute(createAuthorsTable);
    console.log('✅ Authors table created');

    console.log('🔄 Creating author_stats table...');
    await mysqlDb.execute(createAuthorStatsTable);
    console.log('✅ Author stats table created');

    console.log('🔄 Creating categories table...');
    await mysqlDb.execute(createCategoriesTable);
    console.log('✅ Categories table created');

    console.log('🔄 Creating content table...');
    await mysqlDb.execute(createContentTable);
    console.log('✅ Content table created');

    console.log('🔄 Creating attachments table...');
    await mysqlDb.execute(createAttachmentsTable);
    console.log('✅ Attachments table created');

    console.log('🔄 Creating plagiarism_reports table...');
    await mysqlDb.execute(createPlagiarismReportsTable);
    console.log('✅ Plagiarism reports table created');

    console.log('🔄 Creating workflow_events table...');
    await mysqlDb.execute(createWorkflowEventsTable);
    console.log('✅ Workflow events table created');

    console.log('🔄 Creating reviews table...');
    await mysqlDb.execute(createReviewsTable);
    console.log('✅ Reviews table created');

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

    // Reader-related
    console.log('🔄 Creating readers table...');
    await mysqlDb.execute(createReadersTable);
    console.log('✅ Readers table created');

    console.log('🔄 Creating reading_progress table...');
    await mysqlDb.execute(createReadingProgressTable);
    console.log('✅ Reading progress table created');

    console.log('🔄 Creating user_bookmarks table...');
    await mysqlDb.execute(createBookmarksTable);
    console.log('✅ User bookmarks table created');

    console.log('🔄 Creating user_likes table...');
    await mysqlDb.execute(createLikesTable);
    console.log('✅ User likes table created');

    console.log('🔄 Creating recommendations table...');
    await mysqlDb.execute(createRecommendationsTable);
    console.log('✅ Recommendations table created');

    // Editor-related
    console.log('🔄 Creating editors table...');
    await mysqlDb.execute(createEditorsTable);
    console.log('✅ Editors table created');

    console.log('🔄 Creating editor_assignments table...');
    await mysqlDb.execute(createEditorAssignmentsTable);
    console.log('✅ Editor assignments table created');

    console.log('🔄 Creating editor_activity table...');
    await mysqlDb.execute(createEditorActivityTable);
    console.log('✅ Editor activity table created');

    console.log('🔄 Creating notifications table...');
    await mysqlDb.execute(createNotificationsTable);
    console.log('✅ Notifications table created');

    console.log('🔄 Creating communications table...');
    await mysqlDb.execute(createCommunicationsTable);
    console.log('✅ Communications table created');

    console.log('🔄 Creating admin_audit_logs table...');
    await mysqlDb.execute(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        admin_id VARCHAR(36) NOT NULL,
        action VARCHAR(255) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(36),
        details JSON,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admin_log (admin_id),
        INDEX idx_action_log (action)
      )
    `);
    console.log('✅ Admin audit logs table created');

    console.log('🔄 Creating incidents table...');
    await mysqlDb.execute(`
      CREATE TABLE IF NOT EXISTS incidents (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('open', 'investigating', 'resolved', 'dismissed') DEFAULT 'open',
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        submission_id VARCHAR(36),
        reported_by VARCHAR(36),
        assigned_to VARCHAR(36),
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES content(id) ON DELETE SET NULL,
        INDEX idx_incident_status (status),
        INDEX idx_incident_priority (priority)
      )
    `);
    console.log('✅ Incidents table created');

    console.log('🔄 Creating system_settings table...');
    await mysqlDb.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value JSON,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ System settings table created');

    // Versions
    console.log('🔄 Creating versions table...');
    await mysqlDb.execute(createVersionsTable);
    console.log('✅ Versions table created');

    console.log('🔄 Creating partners table...');
    await mysqlDb.execute(createPartnersTable);
    console.log('✅ Partners table created');

    console.log('🔄 Creating partner_events table...');
    await mysqlDb.execute(createPartnerEventsTable);
    console.log('✅ Partner events table created');

    console.log('🔄 Creating article_co_authors table...');
    await mysqlDb.execute(`
      CREATE TABLE IF NOT EXISTS article_co_authors (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        article_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE,
        INDEX idx_co_author_article (article_id)
      )
    `);
    console.log('✅ Article co-authors table created');

    // --- MIGRATIONS for existing tables ---
    console.log('🔄 Running migrations for schema updates...');

    // 1. Update users table role enum and add partner_id
    try {
      await mysqlDb.execute(`
         ALTER TABLE users 
         MODIFY COLUMN role ENUM('reader', 'author', 'reviewer', 'editor', 'content_manager', 'admin', 'partner') DEFAULT 'reader'
       `);
    } catch (e) { /* ignore if already updated or specific error */ }

    try {
      // Check if partner_id exists
      const [cols]: any = await mysqlDb.execute("SHOW COLUMNS FROM users LIKE 'partner_id'");
      if (!cols || cols.length === 0) {
        await mysqlDb.execute("ALTER TABLE users ADD COLUMN partner_id VARCHAR(36), ADD INDEX idx_partner_id (partner_id)");
      }
    } catch (e) { console.log('Notice: users.partner_id migration skipped or failed', (e as any).message); }

    // 2. Update content table for event_id and visibility
    try {
      const [cols]: any = await mysqlDb.execute("SHOW COLUMNS FROM content LIKE 'event_id'");
      if (!cols || cols.length === 0) {
        await mysqlDb.execute("ALTER TABLE content ADD COLUMN event_id VARCHAR(36), ADD INDEX idx_event_content (event_id)");
        await mysqlDb.execute("ALTER TABLE content ADD CONSTRAINT fk_content_event FOREIGN KEY (event_id) REFERENCES partner_events(id) ON DELETE SET NULL");
      }
    } catch (e) { console.log('Notice: content.event_id migration skipped', (e as any).message); }

    try {
      const [cols]: any = await mysqlDb.execute("SHOW COLUMNS FROM content LIKE 'visibility'");
      if (!cols || cols.length === 0) {
        await mysqlDb.execute("ALTER TABLE content ADD COLUMN visibility ENUM('public', 'partner', 'private') DEFAULT 'public', ADD INDEX idx_visibility (visibility)");
      }
    } catch (e) { console.log('Notice: content.visibility migration skipped', (e as any).message); }

    try {
      const [cols]: any = await mysqlDb.execute("SHOW COLUMNS FROM content LIKE 'co_authors'");
      if (!cols || cols.length === 0) {
        await mysqlDb.execute("ALTER TABLE content ADD COLUMN co_authors JSON");
      }
    } catch (e) { console.log('Notice: content.co_authors migration skipped', (e as any).message); }

    console.log('✅ Migrations completed');

    console.log('🔄 Creating reviewer_assignments table...');
    await mysqlDb.execute(createReviewerAssignmentsTable);
    console.log('✅ Reviewer assignments table created');

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

/**
 * Seed default subscription plans (idempotent)
 */
const seedDefaultPlans = async (): Promise<void> => {
  try {
    console.log('🌱 Checking for default subscription plans...');

    const [existingPlans]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM subscription_plans');

    if (existingPlans && existingPlans[0] && existingPlans[0].count === 0) {
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
            'Community access',
          ]),
          duration: 'monthly',
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
            'Email support',
          ]),
          duration: 'monthly',
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
            'Monthly webinars',
          ]),
          duration: 'monthly',
        },
      ];

      for (const plan of defaultPlans) {
        await mysqlDb.execute(
          `INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, duration, created_at)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())`,
          [plan.name, plan.description, plan.price_monthly, plan.price_yearly, plan.features, plan.duration]
        );
      }

      console.log('✅ Default subscription plans seeded');

      const [plansCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM subscription_plans');
      console.log(`📊 Total subscription plans: ${plansCount && plansCount[0] ? plansCount[0].count : 0}`);
    } else {
      console.log(`📊 Subscription plans already exist (${existingPlans && existingPlans[0] ? existingPlans[0].count : 'unknown'} plans found)`);
    }
  } catch (error) {
    console.error('❌ Error seeding default plans:', error);
    logger.error('Error seeding default plans:', error);
  }
};

const verifyTableCreation = async (): Promise<void> => {
  try {
    console.log('🔍 Verifying MySQL table creation...');
    const [tables]: any = await mysqlDb.execute(
      `SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?`,
      [process.env.DB_NAME]
    );

    const tableNames = (tables || []).map((t: any) => t.TABLE_NAME);
    console.log('📋 MySQL tables found:', tableNames);

    const expectedTables = [
      'users',
      'authors',
      'author_stats',
      'categories',
      'content',
      'attachments',
      'plagiarism_reports',
      'workflow_events',
      'reviews',
      'partners',
      'partner_events',
      'subscription_plans',
      'payment_orders',
      'user_subscriptions',
      'payment_transactions',
      'readers',
      'reading_progress',
      'user_bookmarks',
      'user_likes',
      'recommendations',
      'editors',
      'editor_assignments',
      'editor_activity',
      'versions',
      'reviewer_assignments',
      'notifications',
      'communications',
      'incidents',
      'admin_audit_logs',
      'system_settings',
    ];


    const createdTables = expectedTables.filter((table) => tableNames.includes(table));

    console.log('📊 Table creation status:');
    expectedTables.forEach((table) => {
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



/**
 * Export helpers used elsewhere in the project
 */
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
  if (mysqlDb) {
    return mysqlDb;
  }
  throw new Error('No database initialized');
};

/**
 * Health / status helpers
 */
export const checkDatabaseStatus = async (): Promise<any> => {
  const status: any = {};

  try {
    if (mysqlDb) {
      const [result]: any = await mysqlDb.execute('SELECT 1 as test');
      status.mysql = { connected: true, test: result && result[0] ? result[0].test : 0 };

      try {
        const [usersCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM users');
        const [plansCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM subscription_plans');
        const [ordersCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM payment_orders');
        const [subscriptionsCount]: any = await mysqlDb.execute('SELECT COUNT(*) as count FROM user_subscriptions');

        status.mysql.table_counts = {
          users: usersCount && usersCount[0] ? usersCount[0].count : 0,
          subscription_plans: plansCount && plansCount[0] ? plansCount[0].count : 0,
          payment_orders: ordersCount && ordersCount[0] ? ordersCount[0].count : 0,
          user_subscriptions: subscriptionsCount && subscriptionsCount[0] ? subscriptionsCount[0].count : 0,
        };
      } catch (innerErr) {
        logger.warn('checkDatabaseStatus: failed to fetch counts', innerErr);
      }
    } else {
      status.mysql = { connected: false };
    }
  } catch (error) {
    status.mysql = { connected: false, error: error instanceof Error ? error.message : String(error) };
  }

  try {
    if (firestoreDb) {
      // simple read test
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

/**
 * Schema introspection helper
 */
export const getDatabaseSchema = async (): Promise<any> => {
  if (!mysqlDb) {
    throw new Error('MySQL database not initialized');
  }

  try {
    const [tables]: any = await mysqlDb.execute(
      `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH, CREATE_TIME, UPDATE_TIME
       FROM information_schema.tables
       WHERE table_schema = ?
       ORDER BY TABLE_NAME`,
      [process.env.DB_NAME]
    );

    const schemaInfo: any[] = [];

    for (const table of tables || []) {
      const [columns]: any = await mysqlDb.execute(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
         FROM information_schema.columns
         WHERE table_schema = ? AND table_name = ?
         ORDER BY ORDINAL_POSITION`,
        [process.env.DB_NAME, table.TABLE_NAME]
      );

      schemaInfo.push({
        table_name: table.TABLE_NAME,
        table_rows: table.TABLE_ROWS,
        data_length: table.DATA_LENGTH,
        index_length: table.INDEX_LENGTH,
        create_time: table.CREATE_TIME,
        update_time: table.UPDATE_TIME,
        columns: columns || [],
      });
    }

    return schemaInfo;
  } catch (error) {
    console.error('Error getting database schema:', error);
    throw error;
  }
};
