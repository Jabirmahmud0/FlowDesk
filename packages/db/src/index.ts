import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://dummy:dummy@localhost/dummy';
console.log('Database connection string present:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is missing in packages/db. Using dummy connection string for build time.');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

export * from './schema';
export type Database = typeof db;
