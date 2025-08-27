# Google Cloud Integrations for BotRix Dashboard

This document explains the implementation of Google Cloud integrations in the BotRix dashboard, including Google Analytics, Google Calendar, Google Sheets, and Google Translate.

## Overview

The cloud integrations system allows bots to reliably run AI inference, connect to many channels (web, WhatsApp, voice), store and search conversation data, scale when traffic spikes, and offer managed features (analytics, security, backups) without heavy infrastructure overhead.

## Implemented Integrations

### 1. Google Analytics 📊
- **Purpose**: Track website traffic and user behavior
- **Features**:
  - Traffic analysis and reporting
  - User behavior tracking
  - Conversion metrics
  - Real-time reports
  - Page view analytics
  - Traffic source analysis

### 2. Google Calendar 📅
- **Purpose**: Manage calendar events and scheduling automation
- **Features**:
  - Event management and creation
  - Scheduling automation
  - Calendar synchronization
  - Meeting coordination
  - Attendee management

### 3. Google Sheets 📈
- **Purpose**: Read and write spreadsheet data for data management
- **Features**:
  - Data import/export
  - Automated reporting
  - Data analysis
  - Collaborative editing
  - Real-time data sync

### 4. Google Translate 🌐
- **Purpose**: Translate text between languages for multilingual support
- **Features**:
  - Multi-language support
  - Real-time translation
  - Language detection
  - Batch translation
  - 100+ supported languages

## Architecture

### Backend Services

#### 1. Google Integrations Service (`lib/google-integrations.ts`)
- Centralized service for all Google API interactions
- Handles OAuth 2.0 authentication flow
- Manages access tokens and refresh tokens
- Provides unified interface for all Google services

#### 2. Database Model (`models/Integration.ts`)
- MongoDB schema for storing integration configurations
- Supports multiple integration types per user
- Handles token expiration and refresh
- Tracks connection status and metadata

#### 3. API Routes
- `/api/integrations/google/analytics` - Analytics operations
- `/api/integrations/google/calendar` - Calendar operations
- `/api/integrations/google/sheets` - Sheets operations
- `/api/integrations/google/translate` - Translation operations
- `/api/integrations` - General integration management

### Frontend Components

#### 1. Integrations Page (`app/dashboard/integrations/page.tsx`)
- Main integrations overview
- Shows all available integrations
- Handles connection/disconnection

#### 2. Cloud Integrations Page (`app/dashboard/integrations/cloud-integrations/page.tsx`)
- Dedicated page for Google Cloud services
- Matches the design from the reference image
- Expandable integration cards
- Real-time status updates

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Google Analytics OAuth
GOOGLE_ANALYTICS_CLIENT_ID=your_google_analytics_client_id_here
GOOGLE_ANALYTICS_CLIENT_SECRET=your_google_analytics_client_secret_here

# Google Calendar OAuth
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret_here

# Google Sheets OAuth
GOOGLE_SHEETS_CLIENT_ID=your_google_sheets_client_id_here
GOOGLE_SHEETS_CLIENT_SECRET=your_google_sheets_client_secret_here

# Google Translate API
GOOGLE_TRANSLATE_CLIENT_ID=your_google_translate_client_id_here
GOOGLE_TRANSLATE_CLIENT_SECRET=your_google_translate_client_secret_here
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
```

### 2. Google Cloud Console Setup

**Important**: You can create all the required credentials for Google Analytics, Google Calendar, Google Sheets, and Google Translate within your existing "Botrix AI" project. You don't need to create separate projects for each service.

#### Step-by-Step Credential Setup for All Services:

##### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the "Botrix AI" project (as shown in your screenshot)
3. Navigate to "APIs & Services" → "Credentials"

##### Step 2: Enable Required APIs
Before creating credentials, you need to enable the APIs for each service:

1. **For Google Analytics:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Analytics API" and click on it
   - Click "Enable"

2. **For Google Calendar:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API" and click on it
   - Click "Enable"

3. **For Google Sheets:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API" and click on it
   - Click "Enable"

4. **For Google Translate:**
   - Go to "APIs & Services" → "Library"
   - Search for "Cloud Translation API" and click on it
   - Click "Enable"

##### Step 3: Create OAuth Client IDs

**For Google Analytics:**
1. Go to "APIs & Services" → "Credentials"
2. Click "+ Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Application type: "External"
   - App name: "Botrix AI Analytics"
   - User support email: Your email
   - Developer contact information: Your email
   - Add scopes: `https://www.googleapis.com/auth/analytics.readonly`
4. Back to creating OAuth client ID:
   - Application type: "Web application"
   - Name: "Botrix AI Analytics Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/integrations/google/analytics/callback` (development)
     - `https://yourdomain.com/api/integrations/google/analytics/callback` (production)
5. Click "Create"
6. Copy the Client ID and Client Secret for your environment variables

**For Google Calendar:**
1. Click "+ Create Credentials" → "OAuth client ID"
2. Application type: "Web application"
3. Name: "Botrix AI Calendar Client"
4. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
5. Authorized redirect URIs:
   - `http://localhost:3000/api/integrations/google/calendar/callback` (development)
   - `https://yourdomain.com/api/integrations/google/calendar/callback` (production)
6. Click "Create"
7. Copy the Client ID and Client Secret for your environment variables

**For Google Sheets:**
1. Click "+ Create Credentials" → "OAuth client ID"
2. Application type: "Web application"
3. Name: "Botrix AI Sheets Client"
4. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
5. Authorized redirect URIs:
   - `http://localhost:3000/api/integrations/google/sheets/callback` (development)
   - `https://yourdomain.com/api/integrations/google/sheets/callback` (production)
6. Click "Create"
7. Copy the Client ID and Client Secret for your environment variables

**For Google Translate:**
1. Click "+ Create Credentials" → "OAuth client ID"
2. Application type: "Web application"
3. Name: "Botrix AI Translate Client"
4. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
5. Authorized redirect URIs:
   - `http://localhost:3000/api/integrations/google/translate/callback` (development)
   - `https://yourdomain.com/api/integrations/google/translate/callback` (production)
6. Click "Create"
7. Copy the Client ID and Client Secret for your environment variables

##### Step 4: Create API Key for Google Translate (Additional)
For Google Translate, you also need an API key for some operations:

1. Go to "APIs & Services" → "Credentials"
2. Click "+ Create Credentials" → "API Key"
3. Name: "Botrix AI Translate API Key"
4. Click "Create"
5. **Important**: Click on the created API key to configure restrictions:
   - Application restrictions: "HTTP referrers (web sites)"
   - Add your domain: `http://localhost:3000/*` (development)
   - Add your domain: `https://yourdomain.com/*` (production)
   - API restrictions: Select "Cloud Translation API"
6. Click "Save"
7. Copy the API Key for your environment variables

##### Step 5: Configure OAuth Consent Screen (if not done)
If you haven't configured the OAuth consent screen:

1. Go to "APIs & Services" → "OAuth consent screen"
2. Application type: "External"
3. App name: "Botrix AI"
4. User support email: Your email
5. Developer contact information: Your email
6. Add the following scopes:
   - `https://www.googleapis.com/auth/analytics.readonly` (Analytics)
   - `https://www.googleapis.com/auth/calendar` (Calendar)
   - `https://www.googleapis.com/auth/spreadsheets` (Sheets)
   - `https://www.googleapis.com/auth/cloud-translation` (Translate)
7. Add test users (your email addresses) if in testing mode
8. Click "Save and Continue" through all sections

##### Step 6: Update Environment Variables
After creating all credentials, update your `.env.local` file with the actual values:

```bash
# Google Analytics OAuth
GOOGLE_ANALYTICS_CLIENT_ID=your_actual_analytics_client_id
GOOGLE_ANALYTICS_CLIENT_SECRET=your_actual_analytics_client_secret

# Google Calendar OAuth
GOOGLE_CALENDAR_CLIENT_ID=your_actual_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_actual_calendar_client_secret

# Google Sheets OAuth
GOOGLE_SHEETS_CLIENT_ID=your_actual_sheets_client_id
GOOGLE_SHEETS_CLIENT_SECRET=your_actual_sheets_client_secret

# Google Translate OAuth
GOOGLE_TRANSLATE_CLIENT_ID=your_actual_translate_client_id
GOOGLE_TRANSLATE_CLIENT_SECRET=your_actual_translate_client_secret
GOOGLE_TRANSLATE_API_KEY=your_actual_translate_api_key
```

**Note**: All these credentials will be created within your existing "Botrix AI" project, so you'll see multiple OAuth client IDs listed in your credentials page, each with different names for different services.

### 3. Database Setup

The integration model will be automatically created when you first use the integrations. Ensure your MongoDB connection is properly configured.

## Usage Examples

### 1. Connecting Google Analytics

```typescript
// Frontend - Connect Analytics
const handleConnectAnalytics = async () => {
  const response = await fetch('/api/integrations/google/analytics?action=auth');
  const data = await response.json();
  
  if (data.authUrl) {
    window.open(data.authUrl, 'google-oauth', 'width=500,height=600');
  }
};

// Backend - Get Analytics Data
const analyticsData = await googleIntegrations.getAnalyticsData(
  accessToken,
  'ga:123456789', // View ID
  '7daysAgo',
  'today'
);
```

### 2. Managing Calendar Events

```typescript
// Get upcoming events
const events = await googleIntegrations.getCalendarEvents(
  accessToken,
  'primary',
  10
);

// Create new event
const newEvent = await googleIntegrations.createCalendarEvent(
  accessToken,
  {
    summary: 'Team Meeting',
    description: 'Weekly team sync',
    start: '2024-01-15T10:00:00Z',
    end: '2024-01-15T11:00:00Z',
    attendees: [{ email: 'team@example.com' }]
  }
);
```

### 3. Working with Google Sheets

```typescript
// Read sheet data
const sheetData = await googleIntegrations.readSheetData(
  accessToken,
  '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'A1:Z1000'
);

// Write to sheet
await googleIntegrations.writeSheetData(
  accessToken,
  spreadsheetId,
  'A1:B3',
  [['Name', 'Email'], ['John', 'john@example.com'], ['Jane', 'jane@example.com']]
);
```

### 4. Translation Services

```typescript
// Translate text
const translation = await googleIntegrations.translateText(
  'Hello, how are you?',
  'es', // Spanish
  'en'  // English (source)
);

// Detect language
const detection = await googleIntegrations.detectLanguage('Bonjour le monde');
```

## Security Considerations

### 1. OAuth 2.0 Security
- All OAuth flows use secure state parameters
- Access tokens are encrypted and stored securely
- Refresh tokens are handled automatically
- Token expiration is managed properly

### 2. API Key Security
- API keys are stored in environment variables
- Never exposed to client-side code
- Rotated regularly for production use

### 3. Data Privacy
- User data is stored securely in MongoDB
- Integration configurations are user-specific
- Access tokens are encrypted at rest

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const data = await googleIntegrations.getAnalyticsData(accessToken, viewId, startDate, endDate);
  return { success: true, data };
} catch (error) {
  console.error('Analytics API error:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

## Monitoring and Logging

- All API calls are logged for debugging
- Integration status is tracked in the database
- Error messages are stored for troubleshooting
- Connection health is monitored

## Future Enhancements

### Planned Features:
1. **Webhook Support**: Real-time notifications from Google services
2. **Batch Operations**: Process multiple requests efficiently
3. **Advanced Analytics**: Custom reports and dashboards
4. **Multi-language Bot Support**: Automatic translation in conversations
5. **Calendar Integration**: Schedule bot interactions
6. **Data Export**: Export conversation data to Google Sheets

### Integration Ideas:
1. **Google Drive**: Store and manage bot assets
2. **Google Forms**: Create interactive forms
3. **Google Meet**: Schedule video calls
4. **Google Chat**: Integrate with Google Chat
5. **Google Workspace**: Full workspace integration

## Troubleshooting

### Common Issues:

1. **OAuth Error**: Check redirect URIs in Google Cloud Console
2. **Token Expired**: System automatically refreshes tokens
3. **API Quota Exceeded**: Monitor usage in Google Cloud Console
4. **Permission Denied**: Ensure proper scopes are configured

### Debug Steps:

1. Check browser console for client-side errors
2. Review server logs for API errors
3. Verify environment variables are set correctly
4. Test OAuth flow in development environment
5. Check MongoDB connection and integration records

## Support

For issues or questions about the Google Cloud integrations:

1. Check the troubleshooting section above
2. Review Google Cloud Console logs
3. Verify API quotas and billing
4. Contact the development team

---

This implementation provides a robust foundation for Google Cloud integrations in the BotRix dashboard, enabling powerful automation and data management capabilities for bot operations.
