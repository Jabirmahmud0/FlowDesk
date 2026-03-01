import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.error('DATABASE_URL is not set in .env file');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const sql = neon(databaseUrl);

    // Read the migration file
    const migrationPath = path.join(__dirname, 'drizzle/0004_add_search_vectors.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    // Remove comments and split by semicolons
    const statements = migrationSql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    // First pass: Add columns
    console.log('\n--- Adding columns ---');
    const columnStatements = statements.filter(s => s.startsWith('ALTER TABLE'));
    for (const statement of columnStatements) {
        try {
            await sql(statement);
            console.log(`✓ ${statement.substring(0, 70)}...`);
        } catch (error: any) {
            console.error(`✗ Failed: ${error.message}`);
        }
    }

    // Small delay to ensure columns are created
    await new Promise(resolve => setTimeout(resolve, 500));

    // Second pass: Create indexes
    console.log('\n--- Creating indexes ---');
    const indexStatements = statements.filter(s => s.startsWith('CREATE INDEX'));
    for (const statement of indexStatements) {
        try {
            await sql(statement);
            console.log(`✓ ${statement.substring(0, 70)}...`);
        } catch (error: any) {
            console.error(`✗ Failed: ${error.message}`);
        }
    }

    console.log('Migration completed!');
}

runMigration().catch(console.error);
