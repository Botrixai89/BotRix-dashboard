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
  activeConversations: number;
  resolutionRate: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  handoverRate: number;
  avgMessagesPerConversation: number;
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

    // Calculate date range
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'day':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        start = startDate || startOfWeek(now, { weekStartsOn: 1 });
        end = endDate || endOfWeek(now, { weekStartsOn: 1 });
        break;
      default:
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
    }

    // Get conversations in date range
    const conversations = await Conversation.find({
      botId,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 });

    // Calculate analytics
    const conversationAnalytics = await getConversationAnalytics(conversations, start, end);
    const performance = await getPerformanceMetrics(conversations);
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
  const analytics: ConversationAnalytics[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dayStart = startOfDay(current);
    const dayEnd = endOfDay(current);
    
    const dayConversations = conversations.filter(c => 
      c.createdAt >= dayStart && c.createdAt <= dayEnd
    );

    const resolved = dayConversations.filter(c => c.status === 'closed').length;
    const handovers = dayConversations.filter(c => 
      c.messages.some((m: any) => m.sender === 'agent')
    ).length;

    const avgMessages = dayConversations.length > 0 
      ? dayConversations.reduce((sum, c) => sum + c.messages.length, 0) / dayConversations.length
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

async function getPerformanceMetrics(conversations: any[]): Promise<PerformanceMetrics> {
  const totalConversations = conversations.length;
  const activeConversations = conversations.filter(c => c.status === 'active').length;
  const resolvedConversations = conversations.filter(c => c.status === 'closed').length;
  const handoverConversations = conversations.filter(c => 
    c.messages.some((m: any) => m.sender === 'agent')
  ).length;

  // Calculate response times
  const responseTimes: number[] = [];
  conversations.forEach(conversation => {
    const botMessages = conversation.messages.filter((m: any) => m.sender === 'bot');
    const userMessages = conversation.messages.filter((m: any) => m.sender === 'user');
    
    botMessages.forEach((botMsg: any, index: number) => {
      if (userMessages[index]) {
        const responseTime = botMsg.timestamp.getTime() - userMessages[index].timestamp.getTime();
        if (responseTime > 0) {
          responseTimes.push(responseTime);
        }
      }
    });
  });

  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000 // Convert to seconds
    : 0;

  const avgMessagesPerConversation = totalConversations > 0
    ? conversations.reduce((sum, c) => sum + c.messages.length, 0) / totalConversations
    : 0;

  return {
    totalConversations,
    activeConversations,
    resolutionRate: totalConversations > 0 ? (resolvedConversations / totalConversations) * 100 : 0,
    averageResponseTime: Math.round(avgResponseTime * 100) / 100,
    customerSatisfaction: 0, // Will be calculated from ratings
    handoverRate: totalConversations > 0 ? (handoverConversations / totalConversations) * 100 : 0,
    avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 100) / 100
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
  const questionCounts = new Map<string, number>();
  const questionResponseTimes = new Map<string, number[]>();

  conversations.forEach(conversation => {
    const userMessages = conversation.messages.filter((m: any) => m.sender === 'user');
    const botMessages = conversation.messages.filter((m: any) => m.sender === 'bot');

    userMessages.forEach((userMsg: any, index: number) => {
      const question = userMsg.content.toLowerCase().trim();
      questionCounts.set(question, (questionCounts.get(question) || 0) + 1);

      // Calculate response time for this question
      if (botMessages[index]) {
        const responseTime = botMessages[index].timestamp.getTime() - userMsg.timestamp.getTime();
        if (responseTime > 0) {
          const times = questionResponseTimes.get(question) || [];
          times.push(responseTime);
          questionResponseTimes.set(question, times);
        }
      }
    });
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
        percentage: (count / totalQuestions) * 100,
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

    const botMessages = conversation.messages.filter((m: any) => m.sender === 'bot');
    const userMessages = conversation.messages.filter((m: any) => m.sender === 'user');

    botMessages.forEach((botMsg: any, index: number) => {
      if (userMessages[index]) {
        const responseTime = botMsg.timestamp.getTime() - userMessages[index].timestamp.getTime();
        if (responseTime > 0) {
          responseTimes.push(responseTime);
        }
      }
    });

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