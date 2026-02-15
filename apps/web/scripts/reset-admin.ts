import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from web root
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!admin.apps.length) {
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        throw new Error('Firebase Admin environment variables missing');
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const auth = admin.auth();

async function resetPassword() {
    console.log('🔄 Resetting Admin password...');

    const email = 'admin@flowdesk.app';
    const password = 'password123';

    try {
        const user = await auth.getUserByEmail(email);
        console.log(`✅ Found user: ${user.uid} (${user.email})`);

        await auth.updateUser(user.uid, {
            password: password,
            emailVerified: true,
            disabled: false
        });

        console.log(`✅ Password successfully reset to: ${password}`);
        process.exit(0);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.error('❌ User not found! Creating it now...');
            try {
                const userRecord = await auth.createUser({
                    email,
                    emailVerified: true,
                    password,
                    displayName: 'Admin User',
                    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
                    disabled: false,
                });
                console.log('✅ Successfully created new user:', userRecord.uid);
                process.exit(0);
            } catch (createError) {
                console.error('❌ Failed to create user:', createError);
                process.exit(1);
            }
        } else {
            console.error('❌ Error resetting password:', error);
            process.exit(1);
        }
    }
}

resetPassword();
