# Google OAuth Setup Guide for BotrixAI

This guide will help you set up Google OAuth authentication for your BotrixAI application.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your application running locally or deployed

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "BotrixAI")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google+ API" and then "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: BotrixAI
   - User support email: your-email@gmail.com
   - Developer contact information: your-email@gmail.com
   - Save and continue through the other sections

4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: BotrixAI Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"

5. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

3. Generate a secure NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click "Continue with Google" on the login page
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you should be redirected back to your dashboard

## Step 6: Production Deployment

When deploying to production:

1. Update the authorized origins and redirect URIs in Google Cloud Console
2. Update your environment variables with production URLs
3. Ensure your domain is properly configured with HTTPS

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Check that your redirect URI in Google Cloud Console matches exactly
   - Include the full path: `/api/auth/callback/google`

2. **"invalid_client" error**:
   - Verify your Client ID and Client Secret are correct
   - Check that the credentials are for a "Web application" type

3. **"access_denied" error**:
   - Ensure the Google+ API is enabled in your Google Cloud project
   - Check that your OAuth consent screen is properly configured

4. **Session not persisting**:
   - Verify NEXTAUTH_SECRET is set and consistent
   - Check that NEXTAUTH_URL matches your deployment URL

### Security Best Practices:

1. Never commit your `.env.local` file to version control
2. Use strong, unique secrets for NEXTAUTH_SECRET
3. Regularly rotate your Google OAuth credentials
4. Monitor your Google Cloud Console for any suspicious activity
5. Use HTTPS in production

## Additional Configuration

### Customizing the OAuth Flow:

You can customize the OAuth flow by modifying the NextAuth configuration in `app/api/auth/[...nextauth]/route.ts`:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
})
```

### Adding Additional Scopes:

If you need additional user information, you can add scopes:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid email profile https://www.googleapis.com/auth/userinfo.profile'
    }
  }
})
```

## Support

If you encounter any issues:

1. Check the NextAuth.js documentation: https://next-auth.js.org/
2. Review Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
3. Check your browser's developer console for error messages
4. Verify your environment variables are correctly set 