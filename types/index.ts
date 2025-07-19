// User types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bot types
export interface Bot {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'draft';
  userId: string;
  settings: BotSettings;
  metrics: BotMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotSettings {
  welcomeMessage: string;
  primaryColor: string;
  fallbackMessage: string;
  collectUserInfo: boolean;
  handoverEnabled: boolean;
  webhookUrl: string;
}

export interface BotMetrics {
  totalConversations: number;
  newMessages24h: number;
  averageResponseTime: number;
  handoverRate: number;
}

// Conversation types
export interface Conversation {
  _id: string;
  botId: string;
  userId?: string;
  userInfo: {
    name?: string;
    email?: string;
    ip: string;
    userAgent: string;
  };
  messages: Message[];
  status: 'new' | 'active' | 'closed' | 'unassigned';
  assignedTo?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  content: string;
  sender: 'bot' | 'user' | 'agent';
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'button';
  metadata?: any;
}

// Bot Builder types
export interface BotFlow {
  _id: string;
  botId: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  isActive: boolean;
}

export interface FlowNode {
  id: string;
  type: 'message' | 'question' | 'condition' | 'action' | 'handover';
  position: { x: number; y: number };
  data: {
    title: string;
    content: string;
    options?: string[];
    variable?: string;
  };
}

export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

// Team types
export interface TeamMember {
  _id: string;
  botId: string;
  userId: string;
  role: 'admin' | 'editor' | 'agent';
  permissions: string[];
  invitedBy: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: Date;
}

// Analytics types
export interface AnalyticsData {
  period: 'day' | 'week' | 'month';
  conversations: ConversationAnalytics[];
  performance: PerformanceMetrics;
  userEngagement: UserEngagementMetrics;
}

export interface ConversationAnalytics {
  date: string;
  count: number;
  resolved: number;
  handovers: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
}

export interface UserEngagementMetrics {
  totalUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
} 