require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateTerms() {
    console.log('🔄 Starting Terms & Conditions migration...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306', 10),
        });

        console.log('✅ Connected to MySQL database');

        // Add terms_accepted column
        try {
            const [cols] = await connection.execute("SHOW COLUMNS FROM users LIKE 'terms_accepted'");
            if (!cols || cols.length === 0) {
                console.log('🔄 Adding terms_accepted column...');
                await connection.execute("ALTER TABLE users ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE");
                console.log('✅ terms_accepted column added');
            } else {
                console.log('ℹ️ terms_accepted column already exists');
            }
        } catch (e) {
            console.error('❌ Error adding terms_accepted:', e.message);
        }

        // Add terms_accepted_at column
        try {
            const [cols] = await connection.execute("SHOW COLUMNS FROM users LIKE 'terms_accepted_at'");
            if (!cols || cols.length === 0) {
                console.log('🔄 Adding terms_accepted_at column...');
                await connection.execute("ALTER TABLE users ADD COLUMN terms_accepted_at DATETIME NULL");
                console.log('✅ terms_accepted_at column added');
            } else {
                console.log('ℹ️ terms_accepted_at column already exists');
            }
        } catch (e) {
            console.error('❌ Error adding terms_accepted_at:', e.message);
        }

        await connection.end();
        console.log('🎉 Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateTerms();
