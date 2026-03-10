import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { UserRole, JwtPayload } from '../types';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: UserRole;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  private constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:3000'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.io.use(this.authenticate);
    this.setupEventHandlers();
  }

  public static getInstance(server?: HttpServer): WebSocketService {
    if (!WebSocketService.instance && server) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  private authenticate = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(
        token.replace('Bearer ', ''), 
        process.env.JWT_SECRET!
      ) as JwtPayload;
      
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  };

  private setupEventHandlers = () => {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.userId) {
        socket.disconnect();
        return;
      }

      // Store connection
      this.connectedUsers.set(socket.userId, socket);
      
      // Join user-specific room
      socket.join(`user:${socket.userId}`);
      
      // Join role-based rooms
      if (socket.role === UserRole.ADMIN1 || socket.role === UserRole.ADMIN2) {
        socket.join('admins');
      }

      logger.info(`User ${socket.userId} connected to WebSocket`);

      // Send connection confirmation
      socket.emit('connected', { 
        userId: socket.userId,
        role: socket.role,
        timestamp: new Date().toISOString()
      });

      // Handle client events
      socket.on('subscribe', (room: string) => {
        socket.join(room);
        logger.debug(`User ${socket.userId} subscribed to ${room}`);
      });

      socket.on('unsubscribe', (room: string) => {
        socket.leave(room);
        logger.debug(`User ${socket.userId} unsubscribed from ${room}`);
      });

      socket.on('typing', (data) => {
        socket.to(`user:${data.recipientId}`).emit('typing', {
          from: socket.userId,
          isTyping: data.isTyping
        });
      });

      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.userId!);
        logger.info(`User ${socket.userId} disconnected from WebSocket`);
      });
    });
  };

  // Emit to specific user
  emitToUser = (userId: string, event: string, data: any) => {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  // Emit to all admins
  emitToAdmins = (event: string, data: any) => {
    this.io.to('admins').emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  // Emit to all connected clients
  emitToAll = (event: string, data: any) => {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  // Emit to specific room
  emitToRoom = (room: string, event: string, data: any) => {
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  // Check if user is online
  isUserOnline = (userId: string): boolean => {
    return this.connectedUsers.has(userId);
  };

  // Get online users count
  getOnlineUsersCount = (): number => {
    return this.connectedUsers.size;
  };

  // Broadcast system message
  broadcastSystemMessage = (message: string) => {
    this.emitToAll('system', { message });
  };
}