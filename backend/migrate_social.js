const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function migrateSocial() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('🔌 Connected to database...');

        // 1. Create article_comments table
        // id, article_id, user_id, content, created_at
        await connection.query(`
            CREATE TABLE IF NOT EXISTS article_comments (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                article_id CHAR(36) NOT NULL,
                user_id CHAR(36) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Article comments table created/verified');

        // 2. Verify user_likes table
        // compound primary key to prevent duplicate likes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_likes (
                user_id CHAR(36) NOT NULL,
                article_id CHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, article_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ User likes table created/verified');

        console.log('🎉 Social migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateSocial();
