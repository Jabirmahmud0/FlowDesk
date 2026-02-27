const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is missing!');
    process.exit(1);
}

console.log('Testing connection to:', connectionString.replace(/:[^:@]*@/, ':****@'));

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => {
        console.log('Connected successfully!');
        return client.query('SELECT NOW()');
    })
    .then(res => {
        console.log('Server time:', res.rows[0]);
        return client.end();
    })
    .catch(err => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
