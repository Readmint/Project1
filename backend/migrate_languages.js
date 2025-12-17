const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const migrate = async () => {
    try {
        console.log('🔄 Connecting to MySQL...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306', 10),
        });

        console.log('✅ Connected to MySQL');

        // Add language column to content table
        try {
            console.log('🔄 Adding language column to content table...');
            await connection.execute(`
            ALTER TABLE content 
            ADD COLUMN language VARCHAR(50) DEFAULT 'English'
        `);
            console.log('✅ Added language column to content table');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ language column already exists in content table');
            } else {
                throw error;
            }
        }

        // Add preferred_language column to users table
        try {
            console.log('🔄 Adding preferred_language column to users table...');
            await connection.execute(`
            ALTER TABLE users 
            ADD COLUMN preferred_language VARCHAR(50) DEFAULT 'English'
        `);
            console.log('✅ Added preferred_language column to users table');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ preferred_language column already exists in users table');
            } else {
                throw error;
            }
        }

        // Add languages column to editors table (storage for skills) if fields JSON isn't enough or we want explicit column
        // For now, let's Stick to 'fields' JSON for editors as planned, but ensuring 'users' has preferred_language is good for UI.

        console.log('🎉 Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
