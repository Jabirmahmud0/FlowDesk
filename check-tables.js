require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function checkTables() {
    const sql = neon(process.env.DATABASE_URL);
    try {
        const result = await sql(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('document_comments', 'document_versions')
        `);
        console.log('Tables found:', result.map(r => r.table_name));
    } catch (error) {
        console.error('Error:', error.message);
    }
    process.exit(0);
}

checkTables();
