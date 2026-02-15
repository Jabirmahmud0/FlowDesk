const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// Load .env from web root
dotenv.config({ path: path.join(__dirname, '../.env') });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
    fs.writeFileSync(path.join(__dirname, 'reset_error.txt'), 'Missing Firebase Admin environment variables.');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
    });
}

const auth = admin.auth();

async function resetPassword() {

    const email = 'admin@flowdesk.app';
    const password = 'password123';

    try {
        let user;
        try {
            user = await auth.getUserByEmail(email);
            // Verify existing
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                user = await auth.createUser({
                    email,
                    emailVerified: true,
                    password,
                    displayName: 'Admin User',
                    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
                    disabled: false,
                });
                fs.writeFileSync(path.join(__dirname, 'reset_success.txt'), `Created user: ${user.uid}`);
                process.exit(0);
            }
            throw e;
        }

        await auth.updateUser(user.uid, {
            password: password,
            emailVerified: true,
            disabled: false
        });

        fs.writeFileSync(path.join(__dirname, 'reset_success.txt'), `Reset password for: ${user.uid}`);
        process.exit(0);
    } catch (error) {
        fs.writeFileSync(path.join(__dirname, 'reset_error.txt'), `Error: ${error.message}`);
        process.exit(1);
    }
}

resetPassword();
