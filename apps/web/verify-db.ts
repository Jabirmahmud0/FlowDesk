import { db } from '@flowdesk/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf-8');
    env.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
            if (key && !process.env[key]) {
                process.env[key] = value;
            }
        }
    });
} else {
    console.error('.env file not found!');
}

async function main() {
    try {
        console.log('Testing DB connection...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');

        const result = await db.execute(sql`SELECT 1`);
        console.log('DB Connection successful:', result);

        // Try to fetch orgs
        console.log('Fetching organizations...');
        const orgs = await db.query.organizations.findMany({ limit: 1 });
        console.log('Fetched orgs:', orgs);

    } catch (error) {
        console.error('DB Connection failed:', error);
    }
    process.exit(0);
}

main();
