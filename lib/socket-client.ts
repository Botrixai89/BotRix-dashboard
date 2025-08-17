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

  const getAuthToken = (): string | null => {
    // Get token from cookies or localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token') || null;
    }
    return null;
  };

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    // Simulate connection for now - we'll add real Socket.io later
    console.log('Simulating socket connection...');
    setIsConnected(true);

    // Cleanup
    return () => {
      setIsConnected(false);
    };
  }, [user]);

  const joinBot = (botId: string) => {
    console.log('Joining bot:', botId);
    // Socket functionality disabled temporarily
  };

  const leaveBot = (botId: string) => {
    console.log('Leaving bot:', botId);
    // Socket functionality disabled temporarily
  };

  const sendMessage = (botId: string, conversationId: string, message: string, userInfo: any) => {
    console.log('Sending message:', { botId, conversationId, message, userInfo });
    // Simulate message sending - you can add API call here if needed
    setTimeout(() => {
      setLastMessage({
        conversationId,
        message,
        userInfo,
        timestamp: new Date()
      });
    }, 100);
  };

  const startTyping = (botId: string, conversationId: string) => {
    console.log('Start typing:', { botId, conversationId });
    // Socket functionality disabled temporarily
  };

  const stopTyping = (botId: string, conversationId: string) => {
    console.log('Stop typing:', { botId, conversationId });
    // Socket functionality disabled temporarily
  };

  const updateConversationStatus = (botId: string, conversationId: string, status: string) => {
    console.log('Update conversation status:', { botId, conversationId, status });
    // Socket functionality disabled temporarily
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