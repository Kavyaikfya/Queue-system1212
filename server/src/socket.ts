import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const allowedOrigins = corsOriginEnv
    ? corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true;
    if (!corsOriginEnv || corsOriginEnv === '*' || allowedOrigins.includes('*')) {
      return true;
    }
    if (allowedOrigins.includes(origin)) {
      return true;
    }
    if (allowedOrigins.some((o) => o.includes('vercel.app')) && origin.endsWith('.vercel.app')) {
      return true;
    }
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return true;
    }
    return false;
  };

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, origin || true);
        } else {
          console.warn(`[Socket.IO CORS Blocked] Origin: ${origin}`);
          callback(new Error(`Socket.IO CORS blocked origin: ${origin}`), false);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
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
