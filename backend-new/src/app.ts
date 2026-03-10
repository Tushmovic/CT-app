import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { WebSocketService } from './services/websocket.service';
import { errorHandler, notFound } from './middleware/error.middleware';
import { securityHeaders, corsOptions, requestLogger, apiLimiter } from './middleware/security.middleware';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import paymentRoutes from './routes/payment.routes';
import loanRoutes from './routes/loan.routes';
import notificationRoutes from './routes/notification.routes';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket
const wsService = WebSocketService.getInstance(server);

// Middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      websocket: 'running'
    }
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Initialize Redis
    await initializeRedis();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`WebSocket server initialized`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

startServer();

export { app, server, wsService };