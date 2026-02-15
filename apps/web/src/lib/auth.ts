import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@flowdesk/db';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import { users } from '@flowdesk/db';
import { adminAuth } from './firebase/admin';

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    providers: [
        Credentials({
            credentials: {
                idToken: { label: 'ID Token', type: 'text' },
            },
            async authorize(credentials) {
                const idToken = credentials?.idToken as string;

                if (!idToken) {
                    return null;
                }

                try {
                    const decodedToken = await adminAuth.verifyIdToken(idToken);
                    const { email, uid, name, picture } = decodedToken;

                    if (!email) {
                        return null;
                    }

                    // Check if user exists
                    let user = await db.query.users.findFirst({
                        where: eq(users.email, email),
                    });

                    if (!user) {
                        // Create user if not exists
                        // Note: We might want to link the Firebase UID to the user in the future,
                        // but for now we'll rely on email as the unique identifier syncing mechanism.
                        // Ideally, we should add a 'firebaseUid' column to the users table or accounts table.
                        // For this implementation, we'll create a basic user record.
                        const [newUser] = await db
                            .insert(users)
                            .values({
                                name: name || 'Unknown User',
                                email: email,
                                image: picture,
                                emailVerified: decodedToken.email_verified ? new Date() : null,
                            })
                            .returning();
                        user = newUser;
                    }

                    return user;
                } catch (error) {
                    console.error('Error verifying Firebase token:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
    },
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        newUser: '/register',
        error: '/auth-error',
    },
});
