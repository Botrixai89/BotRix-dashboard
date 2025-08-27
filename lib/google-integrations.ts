// Google Cloud Integrations Service
// Handles Google Analytics, Google Calendar, Google Sheets, and Google Translate

export interface GoogleIntegrationConfig {
  type: 'analytics' | 'calendar' | 'sheets' | 'translate';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  apiKey?: string;
}

export interface GoogleAnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{
    page: string;
    views: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
  }>;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: string;
  }>;
}

export interface GoogleSheetsData {
  spreadsheetId: string;
  range: string;
  values: string[][];
  majorDimension: string;
}

export interface GoogleTranslateResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
}

export class GoogleIntegrationsService {
  private configs: Map<string, GoogleIntegrationConfig> = new Map();
  private accessTokens: Map<string, string> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // Google Analytics Configuration
    this.configs.set('analytics', {
      type: 'analytics',
      clientId: process.env.GOOGLE_ANALYTICS_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_ANALYTICS_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/google/analytics/callback`,
      scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/analytics'
      ]
    });

    // Google Calendar Configuration
    this.configs.set('calendar', {
      type: 'calendar',
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/google/calendar/callback`,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    });

    // Google Sheets Configuration
    this.configs.set('sheets', {
      type: 'sheets',
      clientId: process.env.GOOGLE_SHEETS_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_SHEETS_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/google/sheets/callback`,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    });

    // Google Translate Configuration
    this.configs.set('translate', {
      type: 'translate',
      clientId: process.env.GOOGLE_TRANSLATE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_TRANSLATE_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/google/translate/callback`,
      scopes: ['https://www.googleapis.com/auth/cloud-translation'],
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY || ''
    });
  }

  /**
   * Get OAuth URL for Google integration
   */
  getOAuthUrl(type: string, state?: string): string {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(`Unknown integration type: ${type}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(type: string, code: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(`Unknown integration type: ${type}`);
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessTokens.set(type, data.access_token);
    return data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(type: string, refreshToken: string): Promise<{ access_token: string }> {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(`Unknown integration type: ${type}`);
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessTokens.set(type, data.access_token);
    return data;
  }

  /**
   * Google Analytics Integration
   */
  async getAnalyticsData(accessToken: string, viewId: string, startDate: string, endDate: string): Promise<GoogleAnalyticsData> {
    const response = await fetch(`https://analyticsreporting.googleapis.com/v4/reports:batchGet`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportRequests: [
          {
            viewId,
            dateRanges: [{ startDate, endDate }],
            metrics: [
              { expression: 'ga:pageviews' },
              { expression: 'ga:users' },
              { expression: 'ga:bounceRate' },
              { expression: 'ga:avgSessionDuration' }
            ],
            dimensions: [{ name: 'ga:pagePath' }],
            orderBys: [{ fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' }],
            pageSize: 10
          },
          {
            viewId,
            dateRanges: [{ startDate, endDate }],
            metrics: [{ expression: 'ga:sessions' }],
            dimensions: [{ name: 'ga:source' }],
            orderBys: [{ fieldName: 'ga:sessions', sortOrder: 'DESCENDING' }],
            pageSize: 10
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reports = data.reports;

    return {
      pageViews: parseInt(reports[0].data.totals[0].values[0]) || 0,
      uniqueVisitors: parseInt(reports[0].data.totals[0].values[1]) || 0,
      bounceRate: parseFloat(reports[0].data.totals[0].values[2]) || 0,
      avgSessionDuration: parseFloat(reports[0].data.totals[0].values[3]) || 0,
      topPages: reports[0].data.rows?.map((row: any) => ({
        page: row.dimensions[0],
        views: parseInt(row.metrics[0].values[0])
      })) || [],
      trafficSources: reports[1].data.rows?.map((row: any) => ({
        source: row.dimensions[0],
        sessions: parseInt(row.metrics[0].values[0])
      })) || []
    };
  }

  /**
   * Google Calendar Integration
   */
  async getCalendarEvents(accessToken: string, calendarId: string = 'primary', maxResults: number = 10): Promise<GoogleCalendarEvent[]> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items.map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location,
      attendees: event.attendees?.map((attendee: any) => ({
        email: attendee.email,
        name: attendee.displayName,
        responseStatus: attendee.responseStatus
      }))
    }));
  }

  async createCalendarEvent(accessToken: string, event: Omit<GoogleCalendarEvent, 'id'>, calendarId: string = 'primary'): Promise<GoogleCalendarEvent> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: { dateTime: event.start },
          end: { dateTime: event.end },
          location: event.location,
          attendees: event.attendees?.map(attendee => ({ email: attendee.email }))
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      summary: data.summary,
      description: data.description,
      start: data.start.dateTime,
      end: data.end.dateTime,
      location: data.location,
      attendees: data.attendees?.map((attendee: any) => ({
        email: attendee.email,
        name: attendee.displayName,
        responseStatus: attendee.responseStatus
      }))
    };
  }

  /**
   * Google Sheets Integration
   */
  async readSheetData(accessToken: string, spreadsheetId: string, range: string): Promise<GoogleSheetsData> {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      spreadsheetId,
      range: data.range,
      values: data.values || [],
      majorDimension: data.majorDimension
    };
  }

  async writeSheetData(accessToken: string, spreadsheetId: string, range: string, values: string[][]): Promise<void> {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.statusText}`);
    }
  }

  /**
   * Google Translate Integration
   */
  async translateText(text: string, targetLanguage: string, sourceLanguage?: string, apiKey?: string): Promise<GoogleTranslateResult> {
    const config = this.configs.get('translate');
    const key = apiKey || config?.apiKey;
    
    if (!key) {
      throw new Error('Google Translate API key is required');
    }

    const params = new URLSearchParams({
      q: text,
      target: targetLanguage,
      key
    });

    if (sourceLanguage) {
      params.append('source', sourceLanguage);
    }

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Translate API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translation = data.data.translations[0];

    return {
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage,
      confidence: translation.confidence
    };
  }

  async detectLanguage(text: string, apiKey?: string): Promise<{ language: string; confidence: number }> {
    const config = this.configs.get('translate');
    const key = apiKey || config?.apiKey;
    
    if (!key) {
      throw new Error('Google Translate API key is required');
    }

    const params = new URLSearchParams({
      q: text,
      key
    });

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Translate API error: ${response.statusText}`);
    }

    const data = await response.json();
    const detection = data.data.detections[0][0];

    return {
      language: detection.language,
      confidence: detection.confidence
    };
  }

  /**
   * Get supported languages for translation
   */
  async getSupportedLanguages(apiKey?: string): Promise<Array<{ language: string; name: string }>> {
    const config = this.configs.get('translate');
    const key = apiKey || config?.apiKey;
    
    if (!key) {
      throw new Error('Google Translate API key is required');
    }

    const params = new URLSearchParams({
      key
    });

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2/languages?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Translate API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.languages.map((lang: any) => ({
      language: lang.language,
      name: lang.name
    }));
  }

  /**
   * Check integration status
   */
  async checkIntegrationStatus(type: string, accessToken: string): Promise<{ connected: boolean; error?: string }> {
    try {
      switch (type) {
        case 'analytics':
          await this.getAnalyticsData(accessToken, 'ga:123456789', '7daysAgo', 'today');
          break;
        case 'calendar':
          await this.getCalendarEvents(accessToken, 'primary', 1);
          break;
        case 'sheets':
          // Test with a public spreadsheet
          await this.readSheetData(accessToken, '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', 'A1:A1');
          break;
        case 'translate':
          await this.translateText('Hello', 'es');
          break;
        default:
          throw new Error(`Unknown integration type: ${type}`);
      }
      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const googleIntegrations = new GoogleIntegrationsService();
