
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ─── Redis Pub/Sub Adapter (optional, for horizontal scaling) ────────
// When REDIS_URL is set, Socket.io events are shared across all server
// instances via Redis Pub/Sub — required for multi-pod deployments.
// COMMENTED OUT FOR NOW
// async function trySetupRedisAdapter(io: Server): Promise<void> {
//     if (!process.env.REDIS_URL) {
//         console.log('[WS] REDIS_URL not set — using in-memory adapter (single server only)');
//         return;
//     }
//
//     try {
//         const { createAdapter } = await import('@socket.io/redis-adapter');
//         const { default: Redis } = await import('ioredis');
//         const pubClient = new Redis(process.env.REDIS_URL);
//         const subClient = pubClient.duplicate();
//         io.adapter(createAdapter(pubClient, subClient));
//         console.log('[WS] Redis Pub/Sub adapter enabled for horizontal scaling');
//     } catch (err) {
//         console.error('[WS] Failed to set up Redis adapter — falling back to in-memory:', err);
//     }
// }

// ─── Firebase Admin Initialization ──────────────────────────────────
if (!admin.apps.length) {
    // Use service account JSON file if it exists, otherwise use env vars
    const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
    const fs = require('fs');
    
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('[WS] Firebase Admin initialized from service account file');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
        console.log('[WS] Firebase Admin initialized from environment variables');
    } else {
        console.warn('[WS] Firebase credentials not configured - Firebase features disabled');
    }
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 10000,
});

// ─── Presence Tracking ──────────────────────────────────────────────
const onlineUsers = new Map<string, Set<string>>(); // orgId -> Set<userId>

function addOnlineUser(orgId: string, userId: string) {
    if (!onlineUsers.has(orgId)) onlineUsers.set(orgId, new Set());
    onlineUsers.get(orgId)!.add(userId);
}

function removeOnlineUser(orgId: string, userId: string) {
    onlineUsers.get(orgId)?.delete(userId);
    if (onlineUsers.get(orgId)?.size === 0) onlineUsers.delete(orgId);
}

function getOnlineUsers(orgId: string): string[] {
    return Array.from(onlineUsers.get(orgId) || []);
}

// ─── JWT Auth Middleware ─────────────────────────────────────────────
io.use(async (socket: Socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token || typeof token !== 'string') {
            // Allow connection without auth for backward compatibility
            // but mark as unauthenticated
            (socket as any).userId = socket.handshake.query?.userId;
            (socket as any).authenticated = false;
            return next();
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        (socket as any).userId = decodedToken.uid;
        (socket as any).email = decodedToken.email;
        (socket as any).authenticated = true;
        next();
    } catch (error) {
        console.error('Socket auth error:', error);
        // Still allow connection but mark as unauthenticated
        (socket as any).userId = socket.handshake.query?.userId;
        (socket as any).authenticated = false;
        next();
    }
});

// ─── Connection Handler ─────────────────────────────────────────────
io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const authenticated = (socket as any).authenticated as boolean;
    const orgId = socket.handshake.query?.orgId as string;
    const wsId = socket.handshake.query?.wsId as string;

    console.log(`Client connected: ${socket.id} | user: ${userId} | auth: ${authenticated}`);

    // Join user-specific room
    if (userId) {
        socket.join(`user:${userId}`);
    }

    // Join org room and track presence
    if (orgId) {
        socket.join(`org:${orgId}`);
        if (userId) {
            addOnlineUser(orgId, userId);
            // Broadcast presence update to org
            io.to(`org:${orgId}`).emit('PRESENCE_UPDATE', {
                userId,
                status: 'online',
                onlineUsers: getOnlineUsers(orgId),
            });
        }
    }

    // Join workspace room
    if (wsId) {
        socket.join(`ws:${wsId}`);
    }

    // ─── Event Handlers ─────────────────────────────────────────
    socket.on('join:room', (room: string) => {
        socket.join(room);
        console.log(`${socket.id} joined room: ${room}`);
    });

    socket.on('leave:room', (room: string) => {
        socket.leave(room);
        console.log(`${socket.id} left room: ${room}`);
    });

    // Typing indicators
    socket.on('typing:start', (data: { taskId: string; userName: string }) => {
        socket.to(`task:${data.taskId}`).emit('TYPING_START', {
            userId,
            userName: data.userName,
            taskId: data.taskId,
        });
    });

    socket.on('typing:stop', (data: { taskId: string }) => {
        socket.to(`task:${data.taskId}`).emit('TYPING_STOP', {
            userId,
            taskId: data.taskId,
        });
    });

    // Explicit Documented Real-Time Events
    socket.on('task:created', (data: { projectId: string; task: any }) => {
        socket.to(`project:${data.projectId}`).emit('TASK_CREATED', data);
    });

    socket.on('task:moved', (data: { projectId: string; taskId: string; from: string; to: string }) => {
        socket.to(`project:${data.projectId}`).emit('TASK_MOVED', data);
    });

    socket.on('comment:added', (data: { taskId: string; comment: any }) => {
        socket.to(`task:${data.taskId}`).emit('COMMENT_ADDED', data);
    });

    socket.on('notification:new', (data: { userId: string; notification: any }) => {
        socket.to(`user:${data.userId}`).emit('NEW_NOTIFICATION', data);
    });

    // Heartbeat
    socket.on('heartbeat', () => {
        socket.emit('heartbeat:ack', { timestamp: Date.now() });
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id} | reason: ${reason}`);
        if (orgId && userId) {
            removeOnlineUser(orgId, userId);
            io.to(`org:${orgId}`).emit('PRESENCE_UPDATE', {
                userId,
                status: 'offline',
                onlineUsers: getOnlineUsers(orgId),
            });
        }
    });
});

// ─── Private Broadcast Endpoint ─────────────────────────────────────
app.post('/broadcast', (req, res) => {
    const { event, data, room } = req.body;

    if (!event || !room) {
        return res.status(400).json({ error: 'Missing event or room' });
    }

    console.log(`Broadcasting ${event} to room ${room}`);
    io.to(room).emit(event, data);

    res.json({ success: true });
});

// ─── Presence API ───────────────────────────────────────────────────
app.get('/presence/:orgId', (req, res) => {
    const users = getOnlineUsers(req.params.orgId);
    res.json({ onlineUsers: users, count: users.length });
});

// ─── Health Check ───────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        connections: io.engine.clientsCount,
        uptime: process.uptime(),
    });
});

const PORT = process.env.PORT || 3020;
server.listen(PORT, async () => {
    // await trySetupRedisAdapter(io);
    console.log(`WebSocket server running on port ${PORT}`);
});
