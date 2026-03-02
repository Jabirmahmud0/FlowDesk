/**
 * Socket.io Broadcast Utility
 * 
 * Sends real-time events to the WebSocket server for broadcasting to clients.
 * In production, this would use Redis Pub/Sub for horizontal scaling.
 */

const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:3020';

export interface BroadcastEvent {
    event: string;
    data: any;
    room: string;
}

/**
 * Broadcast an event to a specific room via the WebSocket server
 */
export async function broadcastToRoom(event: string, data: any, room: string): Promise<void> {
    try {
        await fetch(`${WS_SERVER_URL}/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, data, room }),
        });
    } catch (error) {
        console.error('[Socket Broadcast] Failed to broadcast event:', error);
    }
}

/**
 * Broadcast task events to project room
 */
export const broadcastTask = {
    created: async (task: any, projectId: string) => {
        await broadcastToRoom('TASK_CREATED', { task }, `project:${projectId}`);
    },
    updated: async (task: any, projectId: string) => {
        await broadcastToRoom('TASK_UPDATED', { task }, `project:${projectId}`);
    },
    moved: async (taskId: string, from: string, to: string, projectId: string) => {
        await broadcastToRoom('TASK_MOVED', { taskId, from, to }, `project:${projectId}`);
    },
    deleted: async (taskId: string, projectId: string) => {
        await broadcastToRoom('TASK_DELETED', { taskId }, `project:${projectId}`);
    },
};

/**
 * Broadcast comment events to task room
 */
export const broadcastComment = {
    added: async (comment: any, taskId: string) => {
        await broadcastToRoom('COMMENT_ADDED', { comment }, `task:${taskId}`);
    },
    updated: async (comment: any, taskId: string) => {
        await broadcastToRoom('COMMENT_UPDATED', { comment }, `task:${taskId}`);
    },
    deleted: async (commentId: string, taskId: string) => {
        await broadcastToRoom('COMMENT_DELETED', { commentId }, `task:${taskId}`);
    },
};

/**
 * Broadcast notification to user room
 */
export const broadcastNotification = {
    new: async (notification: any, userId: string) => {
        await broadcastToRoom('NEW_NOTIFICATION', { notification }, `user:${userId}`);
    },
};

/**
 * Broadcast document events to workspace room
 */
export const broadcastDocument = {
    created: async (document: any, workspaceId: string) => {
        await broadcastToRoom('DOCUMENT_CREATED', { document }, `ws:${workspaceId}`);
    },
    updated: async (document: any, workspaceId: string) => {
        await broadcastToRoom('DOCUMENT_UPDATED', { document }, `ws:${workspaceId}`);
    },
    deleted: async (documentId: string, workspaceId: string) => {
        await broadcastToRoom('DOCUMENT_DELETED', { documentId }, `ws:${workspaceId}`);
    },
};
