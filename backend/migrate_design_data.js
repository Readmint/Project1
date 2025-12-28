require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateDesignData() {
    console.log('🔄 Starting Design Data migration...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306', 10),
        });

        console.log('✅ Connected to MySQL database');

        // Add design_data column
        try {
            const [cols] = await connection.execute("SHOW COLUMNS FROM content LIKE 'design_data'");
            if (!cols || cols.length === 0) {
                console.log('🔄 Adding design_data column...');
                await connection.execute("ALTER TABLE content ADD COLUMN design_data JSON");
                console.log('✅ design_data column added');
            } else {
                console.log('ℹ️ design_data column already exists');
            }
        } catch (e) {
            console.error('❌ Error adding design_data:', e.message);
        }

        await connection.end();
        console.log('🎉 Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateDesignData();
