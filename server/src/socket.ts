import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join specific queue room for live updates
    socket.on('join_queue', (queueId: string) => {
      if (queueId) {
        socket.join(`queue:${queueId}`);
        console.log(`[Socket.IO] ${socket.id} joined room queue:${queueId}`);
      }
    });

    socket.on('leave_queue', (queueId: string) => {
      if (queueId) {
        socket.leave(`queue:${queueId}`);
        console.log(`[Socket.IO] ${socket.id} left room queue:${queueId}`);
      }
    });

    // Join user-specific notification room
    socket.on('join_user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] ${socket.id} joined user room user:${userId}`);
      }
    });

    // Join organization room for admin/staff alerts
    socket.on('join_org', (orgId: string) => {
      if (orgId) {
        socket.join(`org:${orgId}`);
        console.log(`[Socket.IO] ${socket.id} joined room org:${orgId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}
