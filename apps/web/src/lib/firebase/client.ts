import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// User provided config
const firebaseConfig = {
    apiKey: "AIzaSyDqQc4a6fDTwxJZRV2I5v0zGYa1XyZDdzg",
    authDomain: "simple-firebase-be35e.firebaseapp.com",
    projectId: "simple-firebase-be35e",
    storageBucket: "simple-firebase-be35e.firebasestorage.app",
    messagingSenderId: "966314283082",
    appId: "1:966314283082:web:426ed77abf208cc6bc96b3"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };
