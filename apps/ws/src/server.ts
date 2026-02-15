
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all for MVP
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    const { userId, orgId } = socket.handshake.query;

    if (userId) {
        console.log(`User ${userId} joined room user:${userId}`);
        socket.join(`user:${userId}`);
    }

    if (orgId) {
        console.log(`User joined room org:${orgId}`);
        socket.join(`org:${orgId}`);
    }

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Private endpoint for backend to broadcast events
app.post('/broadcast', (req, res) => {
    const { event, data, room } = req.body;

    if (!event || !room) {
        return res.status(400).json({ error: 'Missing event or room' });
    }

    console.log(`Broadcasting ${event} to room ${room}`);
    io.to(room).emit(event, data);

    res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
