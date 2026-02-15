import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
console.log('Database connection string present:', !!connectionString);

if (!connectionString) {
    console.error('DATABASE_URL is missing in packages/db');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

export * from './schema';
export type Database = typeof db;
