import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { initSocketServer } from './socket.js';
import authRoutes from './routes/auth.routes.js';
import orgRoutes from './routes/org.routes.js';
import queueRoutes from './routes/queue.routes.js';
import queueEntriesRoutes from './routes/queueEntries.routes.js';
import counterRoutes from './routes/counter.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import fairnessRoutes from './routes/fairness.routes.js';
import simulatorRoutes from './routes/simulator.routes.js';
import auditRoutes from './routes/audit.routes.js';
import demoRoutes from './routes/demo.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import visionRoutes from './routes/vision.routes.js';
import visitRoutes from './routes/visit.routes.js';
import qevoraRoutes from './routes/qevora.routes.js';
dotenv.config();
const app = express();
const httpServer = http.createServer(app);
// Configure dynamic CORS origin validation from environment variable (TASK 5)
const corsOriginEnv = process.env.CORS_ORIGIN;
const allowedOrigins = corsOriginEnv
    ? corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
export function isOriginAllowed(origin) {
    if (!origin)
        return true;
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
}
// Enable CORS for frontend Vite dev server and production deployments (e.g. Vercel)
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            // Echo origin or return true so Access-Control-Allow-Origin is valid with credentials: true
            callback(null, origin || true);
        }
        else {
            console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
            callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email', 'x-user-name'],
}));
app.use(express.json());
// API Rate Limiting (friendly limit for development & demo)
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Initialize Socket.IO
const io = initSocketServer(httpServer);
// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/queue-entries', queueEntriesRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/fairness', fairnessRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/qevora', qevoraRoutes);
// Root health check endpoint (used by Render and uptime monitors)
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'QEVORA Real-Time Fair Queue System API',
        version: '1.0.0',
        time: new Date().toISOString(),
    });
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Real-Time Fair Queue System API',
        time: new Date().toISOString(),
    });
});
// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({
        error: err.message || 'An unexpected internal server error occurred.',
    });
});
const PORT = Number(process.env.PORT) || 5000;
async function start() {
    try {
        await initDatabase();
        await seedDatabase();
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`=======================================================`);
            console.log(`🚀 REAL-TIME FAIR QUEUE SYSTEM SERVER`);
            console.log(`📡 REST API & Socket.IO running on port ${PORT}`);
            console.log(`=======================================================`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
