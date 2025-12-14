
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
        console.log('Adding pricing and publication fields...');

        // Check if columns exist to avoid error
        const [cols] = await pool.query("SHOW COLUMNS FROM content LIKE 'price'");
        if (cols.length === 0) {
            await pool.query(`
            ALTER TABLE content 
            ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00,
            ADD COLUMN is_free BOOLEAN DEFAULT TRUE,
            ADD COLUMN published_at DATETIME DEFAULT NULL
        `);
            console.log('Columns added successfully.');
        } else {
            console.log('Columns already exist.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        const [rows] = await pool.query("DESCRIBE content");
        console.log("Current Content Schema:", rows.map(r => r.Field));
        await pool.end();
    }
}

migrate();
