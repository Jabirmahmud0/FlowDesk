import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in .env file');
}
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
