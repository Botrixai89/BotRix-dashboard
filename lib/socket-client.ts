'use client'

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

interface SocketMessage {
  conversationId: string;
  message: string;
  userInfo: any;
  timestamp: Date;
}

interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
}

interface ConversationStatusUpdate {
  conversationId: string;
  status: string;
  updatedBy: string;
  timestamp: Date;
}

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<ConversationStatusUpdate[]>([]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Connect to Socket.io server
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: getAuthToken()
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Message events
    socket.on('new-message', (message: SocketMessage) => {
      setLastMessage(message);
    });

    socket.on('user-typing', (typing: TypingIndicator) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(t => 
          !(t.conversationId === typing.conversationId && t.userId === typing.userId)
        );
        return [...filtered, typing];
      });
    });

    socket.on('user-stop-typing', (typing: { conversationId: string; userId: string }) => {
      setTypingUsers(prev => 
        prev.filter(t => 
          !(t.conversationId === typing.conversationId && t.userId === typing.userId)
        )
      );
    });

    socket.on('conversation-status-updated', (update: ConversationStatusUpdate) => {
      setStatusUpdates(prev => [...prev, update]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const getAuthToken = (): string | null => {
    // Get token from cookies or localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token') || null;
    }
    return null;
  };

  const joinBot = (botId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-bot', botId);
    }
  };

  const leaveBot = (botId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-bot', botId);
    }
  };

  const sendMessage = (botId: string, conversationId: string, message: string, userInfo: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-message', {
        botId,
        conversationId,
        message,
        userInfo
      });
    }
  };

  const startTyping = (botId: string, conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing-start', { botId, conversationId });
    }
  };

  const stopTyping = (botId: string, conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing-stop', { botId, conversationId });
    }
  };

  const updateConversationStatus = (botId: string, conversationId: string, status: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update-conversation-status', {
        botId,
        conversationId,
        status
      });
    }
  };

  return {
    isConnected,
    lastMessage,
    typingUsers,
    statusUpdates,
    joinBot,
    leaveBot,
    sendMessage,
    startTyping,
    stopTyping,
    updateConversationStatus
  };
} 