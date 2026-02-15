import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root (../../.env)
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);

// Import db after env is loaded
import { db } from './src/index.js';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('Checking database connection...');
        const result = await db.execute(sql`SELECT count(*) FROM users`);
        console.log('Database check successful. Users count:', result[0]);
        process.exit(0);
    } catch (error) {
        console.error('Database check failed:', error);
        process.exit(1);
    }
}

main();
