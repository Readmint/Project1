
const { createPool } = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const pool = createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'readmint',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('Creating Order and Payment tables...');

        // 1. ORDERS Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
        transaction_id VARCHAR(100) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

        // 2. ORDER ITEMS Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        article_id VARCHAR(36) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE
      )
    `);

        // 3. USER PURCHASES Table (Simplified access control)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS user_purchases (
        user_id VARCHAR(36) NOT NULL,
        article_id VARCHAR(36) NOT NULL,
        purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, article_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE
      )
    `);

        console.log('Tables created successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        const [tables] = await pool.query("SHOW TABLES");
        console.log("Current Tables:", tables);
        await pool.end();
    }
}

migrate();
