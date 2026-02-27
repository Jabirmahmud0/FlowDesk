import * as admin from 'firebase-admin';

if (!admin.apps.length && process.env.FIREBASE_ADMIN_PROJECT_ID) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.warn('Firebase admin initialization error', error);
    }
} else if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.warn('Firebase admin env vars missing, skipping initialization (safe for build time)');
}

export const adminAuth = (admin.apps.length > 0 ? admin.auth() : {}) as admin.auth.Auth;
