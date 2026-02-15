import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from web root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedFirebase() {
    console.log('🔥 Starting Firebase Auth seed...');

    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        throw new Error('Firebase Admin environment variables missing');
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }

    const auth = admin.auth();

    const email = 'admin@flowdesk.app';
    const password = 'password123';

    try {
        try {
            // Check if user exists
            const userRecord = await auth.getUserByEmail(email);
            console.log('ℹ️ User already exists in Firebase:', userRecord.email);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log('Creating Firebase user...');
                const userRecord = await auth.createUser({
                    email,
                    emailVerified: true,
                    password,
                    displayName: 'Admin User',
                    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
                    disabled: false,
                });
                console.log('✅ Successfully created new user:', userRecord.uid);
            } else {
                throw error;
            }
        }

        console.log('🔥 Firebase seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding Firebase:', error);
        process.exit(1);
    }
}

seedFirebase();
