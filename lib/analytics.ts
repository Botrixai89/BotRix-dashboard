import dbConnect from './mongodb';
import Conversation from '@/models/Conversation';
import Bot from '@/models/Bot';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'custom';
  conversations: ConversationAnalytics[];
  performance: PerformanceMetrics;
  userEngagement: UserEngagementMetrics;
  topQuestions: TopQuestion[];
  responseTime: ResponseTimeData[];
  handoverRate: HandoverRateData[];
  satisfaction: SatisfactionData[];
}

export interface ConversationAnalytics {
  date: string;
  count: number;
  resolved: number;
  handovers: number;
  avgMessages: number;
}

export interface PerformanceMetrics {
  totalConversations: number;
  totalSessions: number;
  totalInteractions: number;
  uniqueUsers: number;
  activeUsers: number;
  activeConversations: number;
  resolutionRate: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  handoverRate: number;
  avgMessagesPerConversation: number;
  averageInteractionsPerUser: number;
}

export interface UserEngagementMetrics {
  totalUsers: number;
  returningUsers: number;
  newUsers: number;
  averageSessionDuration: number;
  peakHours: HourlyData[];
  userRetention: RetentionData[];
}

export interface TopQuestion {
  question: string;
  count: number;
  percentage: number;
  avgResponseTime: number;
}

export interface ResponseTimeData {
  date: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface HandoverRateData {
  date: string;
  handoverRate: number;
  totalConversations: number;
  handovers: number;
}

export interface SatisfactionData {
  date: string;
  satisfaction: number;
  totalRatings: number;
}

export interface HourlyData {
  hour: number;
  conversations: number;
  users: number;
}

export interface RetentionData {
  day: number;
  retention: number;
  users: number;
}

export async function getBotAnalytics(
  botId: string,
  period: 'day' | 'week' | 'month' | 'custom' = 'week',
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsData> {
  try {
    await dbConnect();

    // Validate botId
    if (!botId || typeof botId !== 'string') {
      throw new Error('Invalid bot ID provided');
    }

    // Calculate date range
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'day':
        // Use yesterday to ensure we have complete data
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = startOfDay(yesterday);
        end = endOfDay(yesterday);
        break;
      case 'week':
        // Use last week to ensure we have complete data
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        start = startOfWeek(lastWeek, { weekStartsOn: 1 });
        end = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case 'month':
        // Use last month to ensure we have complete data
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'custom':
        if (!startDate || !endDate) {
          throw new Error('Start and end dates are required for custom period');
        }
        if (startDate > endDate) {
          throw new Error('Start date cannot be after end date');
        }
        start = startDate;
        end = endDate;
        break;
      default:
        // Default to last week
        const defaultLastWeek = new Date(now);
        defaultLastWeek.setDate(defaultLastWeek.getDate() - 7);
        start = startOfWeek(defaultLastWeek, { weekStartsOn: 1 });
        end = endOfWeek(defaultLastWeek, { weekStartsOn: 1 });
    }

    // Validate date range
    if (start > end) {
      throw new Error('Invalid date range: start date is after end date');
    }

    // Get conversations in date range
    const conversations = await Conversation.find({
      botId,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 });

    // Validate conversations data
    if (!Array.isArray(conversations)) {
      throw new Error('Failed to fetch conversations data');
    }

    // Calculate analytics
    const conversationAnalytics = await getConversationAnalytics(conversations, start, end);
    const performance = await getPerformanceMetrics(conversations, start, end);
    const userEngagement = await getUserEngagementMetrics(conversations, start, end);
    const topQuestions = await getTopQuestions(conversations);
    const responseTime = await getResponseTimeData(conversations, start, end);
    const handoverRate = await getHandoverRateData(conversations, start, end);
    const satisfaction = await getSatisfactionData(conversations, start, end);

    return {
      period,
      conversations: conversationAnalytics,
      performance,
      userEngagement,
      topQuestions,
      responseTime,
      handoverRate,
      satisfaction
    };
  } catch (error) {
    console.error('Error getting bot analytics:', error);
    throw error;
  }
}

async function getConversationAnalytics(
  conversations: any[],
  start: Date,
  end: Date
): Promise<ConversationAnalytics[]> {
  // Validate input
  if (!Array.isArray(conversations)) {
    conversations = [];
  }

  const analytics: ConversationAnalytics[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dayStart = startOfDay(current);
    const dayEnd = endOfDay(current);
    
    const dayConversations = conversations.filter(c => 
      c?.createdAt && c.createdAt >= dayStart && c.createdAt <= dayEnd
    );

    const resolved = dayConversations.filter(c => c?.status === 'closed').length;
    const handovers = dayConversations.filter(c => 
      c?.messages && Array.isArray(c.messages) && c.messages.some((m: any) => m?.sender === 'agent')
    ).length;

    const totalMessages = dayConversations.reduce((sum, c) => {
      if (c?.messages && Array.isArray(c.messages)) {
        return sum + c.messages.length;
      }
      return sum;
    }, 0);

    const avgMessages = dayConversations.length > 0 
      ? totalMessages / dayConversations.length
      : 0;

    analytics.push({
      date: current.toISOString().split('T')[0],
      count: dayConversations.length,
      resolved,
      handovers,
      avgMessages: Math.round(avgMessages * 100) / 100
    });

    current.setDate(current.getDate() + 1);
  }

  return analytics;
}

async function getPerformanceMetrics(
  conversations: any[],
  start: Date,
  end: Date
): Promise<PerformanceMetrics> {
  // Validate input
  if (!Array.isArray(conversations)) {
    conversations = [];
  }

  const totalConversations = conversations.length;
  const activeConversations = conversations.filter(c => c?.status === 'active').length;
  const resolvedConversations = conversations.filter(c => c?.status === 'closed').length;
  const handoverConversations = conversations.filter(c => 
    c?.messages && Array.isArray(c.messages) && c.messages.some((m: any) => m?.sender === 'agent')
  ).length;

  // Calculate total interactions (all messages)
  const totalInteractions = conversations.reduce((sum, c) => {
    if (c?.messages && Array.isArray(c.messages)) {
      return sum + c.messages.length;
    }
    return sum;
  }, 0);

  // Calculate unique users within the selected period
  const uniqueUsers = new Set(
    conversations
      .map(c => c?.userId)
      .filter(Boolean)
  );
  const totalUniqueUsers = uniqueUsers.size;

  // Calculate active users within the selected period (not hardcoded to last 7 days)
  const activeUsers = new Set(
    conversations
      .filter(c => c?.createdAt && c.createdAt >= start && c.createdAt <= end)
      .map(c => c?.userId)
      .filter(Boolean)
  ).size;

  // Calculate total sessions (unique conversation starts per day per user)
  const sessionsMap = new Map<string, Set<string>>();
  conversations.forEach(conversation => {
    if (!conversation?.createdAt || !conversation?._id) return;
    
    const date = new Date(conversation.createdAt).toISOString().split('T')[0];
    const userId = conversation.userId || 'anonymous';
    const key = `${userId}-${date}`;
    
    if (!sessionsMap.has(key)) {
      sessionsMap.set(key, new Set());
    }
    sessionsMap.get(key)!.add(conversation._id.toString());
  });
  const totalSessions = sessionsMap.size;

  // Calculate response times
  const responseTimes: number[] = [];
  conversations.forEach(conversation => {
    if (!conversation?.messages || !Array.isArray(conversation.messages)) return;
    
    const messages = conversation.messages
      .filter((m: any) => m?.timestamp && m?.sender)
      .sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    
    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i];
      const nextMsg = messages[i + 1];
      
      // If current message is from user and next message is from bot, calculate response time
      if (currentMsg.sender === 'user' && nextMsg.sender === 'bot') {
        const responseTime = new Date(nextMsg.timestamp).getTime() - new Date(currentMsg.timestamp).getTime();
        if (responseTime > 0) {
          responseTimes.push(responseTime);
        }
      }
    }
  });

  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000 // Convert to seconds
    : 0;

  const avgMessagesPerConversation = totalConversations > 0
    ? totalInteractions / totalConversations
    : 0;

  const averageInteractionsPerUser = totalUniqueUsers > 0
    ? totalInteractions / totalUniqueUsers
    : 0;

  return {
    totalConversations,
    totalSessions,
    totalInteractions,
    uniqueUsers: totalUniqueUsers,
    activeUsers,
    activeConversations,
    resolutionRate: totalConversations > 0 ? (resolvedConversations / totalConversations) * 100 : 0,
    averageResponseTime: Math.round(avgResponseTime * 100) / 100,
    customerSatisfaction: 0, // Will be calculated from ratings
    handoverRate: totalConversations > 0 ? (handoverConversations / totalConversations) * 100 : 0,
    avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 100) / 100,
    averageInteractionsPerUser: Math.round(averageInteractionsPerUser * 100) / 100
  };
}

async function getUserEngagementMetrics(
  conversations: any[],
  start: Date,
  end: Date
): Promise<UserEngagementMetrics> {
  const uniqueUsers = new Set(conversations.map(c => c.userId).filter(Boolean));
  const totalUsers = uniqueUsers.size;

  // Calculate returning users (users with multiple conversations)
  const userConversationCounts = new Map<string, number>();
  conversations.forEach(c => {
    if (c.userId) {
      userConversationCounts.set(c.userId, (userConversationCounts.get(c.userId) || 0) + 1);
    }
  });

  const returningUsers = Array.from(userConversationCounts.values()).filter(count => count > 1).length;
  const newUsers = totalUsers - returningUsers;

  // Calculate peak hours
  const hourlyData = new Array(24).fill(0).map((_, hour) => ({ hour, conversations: 0, users: 0 }));
  const hourlyUsers = new Array(24).fill(0).map(() => new Set<string>());

  conversations.forEach(conversation => {
    const hour = conversation.createdAt.getHours();
    hourlyData[hour].conversations++;
    if (conversation.userId) {
      hourlyUsers[hour].add(conversation.userId);
    }
  });

  hourlyData.forEach((data, hour) => {
    data.users = hourlyUsers[hour].size;
  });

  return {
    totalUsers,
    returningUsers,
    newUsers,
    averageSessionDuration: 0, // Would need session tracking
    peakHours: hourlyData,
    userRetention: [] // Would need historical data
  };
}

async function getTopQuestions(conversations: any[]): Promise<TopQuestion[]> {
  // Validate input
  if (!Array.isArray(conversations)) {
    conversations = [];
  }

  const questionCounts = new Map<string, number>();
  const questionResponseTimes = new Map<string, number[]>();

  conversations.forEach(conversation => {
    if (!conversation?.messages || !Array.isArray(conversation.messages)) return;
    
    const messages = conversation.messages
      .filter((m: any) => m?.timestamp && m?.sender && m?.content)
      .sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i];
      const nextMsg = messages[i + 1];
      
      // If current message is from user and next message is from bot, calculate response time
      if (currentMsg.sender === 'user' && nextMsg.sender === 'bot') {
        const question = currentMsg.content.toLowerCase().trim();
        if (question) { // Only count non-empty questions
          questionCounts.set(question, (questionCounts.get(question) || 0) + 1);

          const responseTime = new Date(nextMsg.timestamp).getTime() - new Date(currentMsg.timestamp).getTime();
          if (responseTime > 0) {
            const times = questionResponseTimes.get(question) || [];
            times.push(responseTime);
            questionResponseTimes.set(question, times);
          }
        }
      }
    }
  });

  const totalQuestions = Array.from(questionCounts.values()).reduce((sum, count) => sum + count, 0);

  return Array.from(questionCounts.entries())
    .map(([question, count]) => {
      const responseTimes = questionResponseTimes.get(question) || [];
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000
        : 0;

      return {
        question,
        count,
        percentage: totalQuestions > 0 ? (count / totalQuestions) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function getResponseTimeData(
  conversations: any[],
  start: Date,
  end: Date
): Promise<ResponseTimeData[]> {
  const dailyResponseTimes = new Map<string, number[]>();

  conversations.forEach(conversation => {
    const date = conversation.createdAt.toISOString().split('T')[0];
    const responseTimes: number[] = [];

    const messages = conversation.messages.sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i];
      const nextMsg = messages[i + 1];
      
      // If current message is from user and next message is from bot, calculate response time
      if (currentMsg.sender === 'user' && nextMsg.sender === 'bot') {
        const responseTime = new Date(nextMsg.timestamp).getTime() - new Date(currentMsg.timestamp).getTime();
        if (responseTime > 0) {
          responseTimes.push(responseTime);
        }
      }
    }

    if (responseTimes.length > 0) {
      const existing = dailyResponseTimes.get(date) || [];
      dailyResponseTimes.set(date, [...existing, ...responseTimes]);
    }
  });

  return Array.from(dailyResponseTimes.entries()).map(([date, times]) => {
    const sortedTimes = times.sort((a, b) => a - b);
    const avgResponseTime = times.reduce((sum, time) => sum + time, 0) / times.length / 1000;
    const p95Index = Math.floor(times.length * 0.95);
    const p99Index = Math.floor(times.length * 0.99);

    return {
      date,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      p95ResponseTime: Math.round((sortedTimes[p95Index] || 0) / 1000 * 100) / 100,
      p99ResponseTime: Math.round((sortedTimes[p99Index] || 0) / 1000 * 100) / 100
    };
  });
}

async function getHandoverRateData(
  conversations: any[],
  start: Date,
  end: Date
): Promise<HandoverRateData[]> {
  const dailyHandovers = new Map<string, { handovers: number; total: number }>();

  conversations.forEach(conversation => {
    const date = conversation.createdAt.toISOString().split('T')[0];
    const hasHandover = conversation.messages.some((m: any) => m.sender === 'agent');
    
    const current = dailyHandovers.get(date) || { handovers: 0, total: 0 };
    current.total++;
    if (hasHandover) current.handovers++;
    dailyHandovers.set(date, current);
  });

  return Array.from(dailyHandovers.entries()).map(([date, data]) => ({
    date,
    handoverRate: data.total > 0 ? (data.handovers / data.total) * 100 : 0,
    totalConversations: data.total,
    handovers: data.handovers
  }));
}

async function getSatisfactionData(
  conversations: any[],
  start: Date,
  end: Date
): Promise<SatisfactionData[]> {
  // This would typically come from user ratings
  // For now, we'll return empty data
  return [];
}

// Export analytics data
export async function exportAnalyticsData(botId: string, format: 'csv' | 'json' = 'json'): Promise<string> {
  const analytics = await getBotAnalytics(botId, 'month');
  
  if (format === 'csv') {
    return convertToCSV(analytics);
  }
  
  return JSON.stringify(analytics, null, 2);
}

function convertToCSV(analytics: AnalyticsData): string {
  const headers = ['Date', 'Conversations', 'Resolved', 'Handovers', 'Avg Messages'];
  const rows = analytics.conversations.map(c => [
    c.date,
    c.count,
    c.resolved,
    c.handovers,
    c.avgMessages
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
} 