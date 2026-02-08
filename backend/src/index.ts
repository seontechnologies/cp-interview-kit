import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { WebSocketServer } from 'ws';

import analyticsRoutes from './routes/analytics';
import auditRoutes from './routes/audit';
import authRoutes from './routes/auth';
import billingRoutes from './routes/billing';
import dashboardRoutes from './routes/dashboard';
import notificationsRoutes from './routes/notifications';
import organizationsRoutes from './routes/organizations';
import usersRoutes from './routes/users';
import webhooksRoutes from './routes/webhooks';

import { swaggerSpec } from './config/swagger';
import { startNotificationJob } from './jobs/notifications';
import { startReportJob } from './jobs/reports';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimit';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

export const prisma = new PrismaClient();

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false
  })
);

// CORS Configuration - Environment-specific
const PORT = process.env.PORT || 3001;
const backendOrigin = `http://localhost:${PORT}`;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

// Allow backend's own origin in dev (for Swagger UI)
if (!allowedOrigins.includes(backendOrigin) && process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(backendOrigin);
  console.log("Allowed origins are:", JSON.stringify(allowedOrigins));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests with no origin OK (curl, Postman, same-origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 300 // Cache preflight requests for 5 minutes
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(rateLimiter);

// Swagger UI - Only in development mode
if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }'
    })
  );
  console.log('You are in dev mode. Access Swagger UI at /api-docs');
}

// Health check - this is fine, no auth needed
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/organizations', authMiddleware, organizationsRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/dashboards', authMiddleware, dashboardRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/billing', authMiddleware, billingRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);
app.use('/api/audit', authMiddleware, auditRoutes);
app.use('/api/webhooks', authMiddleware, webhooksRoutes);

// WebSocket handling
const wsClients = new Map<string, Set<any>>();

wss.on('connection', (ws, req) => {
  const orgId = req.url?.split('?org=')[1];

  if (orgId) {
    if (!wsClients.has(orgId)) {
      wsClients.set(orgId, new Set());
    }
    wsClients.get(orgId)!.add(ws);

    ws.on('close', () => {
      wsClients.get(orgId)?.delete(ws);
    });
  }

  ws.on('message', (data) => {
    // Broadcast to all clients in same org
    const message = JSON.parse(data.toString());
    if (message.orgId && wsClients.has(message.orgId)) {
      wsClients.get(message.orgId)?.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(message));
        }
      });
    }
  });
});

// Broadcast helper for routes to use
export function broadcastToOrg(orgId: string, message: object) {
  if (wsClients.has(orgId)) {
    wsClients.get(orgId)?.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  // Security: Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && {
      message: err.message,
      stack: err.stack
    })
  });
});

// Start background jobs only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startNotificationJob();
  startReportJob();
}

// Only start the server if this file is run directly (not imported for tests)
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
export { server };
