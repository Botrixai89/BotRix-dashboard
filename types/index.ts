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
  widgetIcon?: string;
  widgetIconType: 'default' | 'custom' | 'emoji';
  widgetIconEmoji: string;
  headerColor: string;
  footerColor: string;
  bodyColor: string;
  logo?: string;
  widgetImages?: string[];
  botType?: 'webhook' | 'rule-based' | 'hybrid';
  ruleBasedConfig?: {
    enabled: boolean;
    rules: Array<{
      id: string;
      name: string;
      conditions: Array<{
        field: string;
        operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than' | 'in_list';
        value: any;
        caseSensitive?: boolean;
      }>;
      actions: Array<{
        type: 'send_message' | 'send_image' | 'set_variable' | 'call_webhook' | 'redirect' | 'pause';
        data: any;
        order: number;
      }>;
      priority: number;
      isActive: boolean;
    }>;
    variables: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      defaultValue: any;
      description: string;
    }>;
  };
  webhookConfig?: {
    primary: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      headers: Record<string, string>;
      timeout: number;
      retryAttempts: number;
      isActive: boolean;
    };
    fallback: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      headers: Record<string, string>;
      timeout: number;
      retryAttempts: number;
      isActive: boolean;
    };
    customWebhooks: Array<{
      id: string;
      name: string;
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      headers: Record<string, string>;
      timeout: number;
      retryAttempts: number;
      isActive: boolean;
      triggerConditions: Array<{
        field: string;
        operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
        value: any;
      }>;
    }>;
  };
  voiceEnabled?: boolean;
  voiceSettings?: VoiceSettings;
  conversationFlows?: {
    paths: Array<{
      id: string;
      name: string;
      description: string;
      isActive: boolean;
      flowData?: {
        root: string;
        nodes: Record<string, any>;
        edges: Record<string, string[]>;
      };
    }>;
    activePath?: string;
  };
}

export interface BotMetrics {
  totalConversations: number;
  totalSessions: number;
  totalInteractions: number;
  uniqueUsers: number;
  activeUsers: number;
  newMessages24h: number;
  averageResponseTime: number;
  handoverRate: number;
  averageInteractionsPerUser: number;
  lastUpdated: Date;
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

export interface VoiceSettings {
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number;
  pitch: number;
  language: string;
}

export interface Message {
  _id: string;
  content: string;
  sender: 'bot' | 'user' | 'agent';
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'button';
  metadata?: any;
  voiceSettings?: VoiceSettings;
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