import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './auth';
import dbConnect from './mongodb';
import Conversation from '@/models/Conversation';
import Bot from '@/models/Bot';

interface AuthenticatedSocket {
  userId: string;
  userEmail: string;
  userName: string;
}

export class SocketServer {
  private io: SocketIOServer;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]
  private botSockets: Map<string, string[]> = new Map(); // botId -> socketIds[]

  constructor(server: HTTPServer, io?: SocketIOServer) {
    if (io) {
      this.io = io;
    } else {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: process.env.NODE_ENV === 'production' 
            ? ['https://yourdomain.com'] 
            : ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          credentials: true
        }
      });
    }

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const payload = verifyToken(token);
        if (!payload) {
          return next(new Error('Invalid token'));
        }

        // Attach user info to socket
        (socket as any).user = {
          userId: payload.userId,
          userEmail: payload.email,
          userName: payload.name
        };

        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = (socket as any).user as AuthenticatedSocket;
      
      console.log(`User connected: ${user.userName} (${user.userId})`);

      // Join user's personal room
      socket.join(`user:${user.userId}`);
      this.addUserSocket(user.userId, socket.id);

      // Handle joining bot rooms
      socket.on('join-bot', async (botId: string) => {
        try {
          await dbConnect();
          const bot = await Bot.findById(botId);
          
          if (bot && bot.userId.toString() === user.userId) {
            socket.join(`bot:${botId}`);
            this.addBotSocket(botId, socket.id);
            console.log(`User ${user.userName} joined bot ${botId}`);
          }
        } catch (error) {
          console.error('Error joining bot room:', error);
        }
      });

      // Handle leaving bot rooms
      socket.on('leave-bot', (botId: string) => {
        socket.leave(`bot:${botId}`);
        this.removeBotSocket(botId, socket.id);
        console.log(`User ${user.userName} left bot ${botId}`);
      });

      // Handle real-time chat messages
      socket.on('send-message', async (data: {
        botId: string;
        conversationId: string;
        message: string;
        userInfo: any;
      }) => {
        try {
          // Emit to bot room for real-time updates
          this.io.to(`bot:${data.botId}`).emit('new-message', {
            conversationId: data.conversationId,
            message: data.message,
            userInfo: data.userInfo,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error handling real-time message:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { botId: string; conversationId: string }) => {
        socket.to(`bot:${data.botId}`).emit('user-typing', {
          conversationId: data.conversationId,
          userId: user.userId,
          userName: user.userName
        });
      });

      socket.on('typing-stop', (data: { botId: string; conversationId: string }) => {
        socket.to(`bot:${data.botId}`).emit('user-stop-typing', {
          conversationId: data.conversationId,
          userId: user.userId
        });
      });

      // Handle conversation status updates
      socket.on('update-conversation-status', async (data: {
        botId: string;
        conversationId: string;
        status: string;
      }) => {
        try {
          await dbConnect();
          await Conversation.findByIdAndUpdate(data.conversationId, {
            status: data.status
          });

          // Notify all users in the bot room
          this.io.to(`bot:${data.botId}`).emit('conversation-status-updated', {
            conversationId: data.conversationId,
            status: data.status,
            updatedBy: user.userId,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error updating conversation status:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.removeUserSocket(user.userId, socket.id);
        console.log(`User disconnected: ${user.userName} (${user.userId})`);
      });
    });
  }

  private addUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(socketId);
    this.userSockets.set(userId, sockets);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || [];
    const filteredSockets = sockets.filter(id => id !== socketId);
    
    if (filteredSockets.length === 0) {
      this.userSockets.delete(userId);
    } else {
      this.userSockets.set(userId, filteredSockets);
    }
  }

  private addBotSocket(botId: string, socketId: string) {
    const sockets = this.botSockets.get(botId) || [];
    sockets.push(socketId);
    this.botSockets.set(botId, sockets);
  }

  private removeBotSocket(botId: string, socketId: string) {
    const sockets = this.botSockets.get(botId) || [];
    const filteredSockets = sockets.filter(id => id !== socketId);
    
    if (filteredSockets.length === 0) {
      this.botSockets.delete(botId);
    } else {
      this.botSockets.set(botId, filteredSockets);
    }
  }

  // Public methods for external use
  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToBot(botId: string, event: string, data: any) {
    this.io.to(`bot:${botId}`).emit(event, data);
  }

  public emitToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public getConnectedBots(): string[] {
    return Array.from(this.botSockets.keys());
  }
} 