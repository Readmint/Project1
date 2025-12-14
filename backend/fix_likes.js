const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function fixLikes() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('🔌 Connected to database...');

        console.log('🗑️ Dropping existing user_likes table...');
        await connection.query('DROP TABLE IF EXISTS user_likes');

        console.log('✨ Recreating user_likes table...');
        await connection.query(`
            CREATE TABLE user_likes (
                user_id CHAR(36) NOT NULL,
                article_id CHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, article_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (article_id) REFERENCES content(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ User likes table recreated successfully!');

    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixLikes();
