# OAuth Authentication Troubleshooting Guide

## Common Issues and Solutions

### 1. Environment Variables Not Set

**Problem**: Google OAuth credentials are not properly configured.

**Solution**: Ensure these environment variables are set in your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/botrix-dashboard
```

### 2. Google OAuth App Configuration Issues

**Problem**: Google OAuth app is not properly configured.

**Solution**: 
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 3. Database Connection Issues

**Problem**: MongoDB connection fails during OAuth flow.

**Solution**:
1. Check if MongoDB is running
2. Verify `MONGODB_URI` is correct
3. Ensure network connectivity
4. Check MongoDB logs for errors

### 4. Session/Cookie Issues

**Problem**: Authentication state is not properly maintained.

**Solution**:
1. Clear browser cookies and cache
2. Check if cookies are being set properly
3. Verify `NEXTAUTH_SECRET` is set
4. Ensure `NEXTAUTH_URL` matches your domain

### 5. CORS Issues

**Problem**: Cross-origin requests are blocked.

**Solution**:
1. Check browser console for CORS errors
2. Verify domain configuration in Google OAuth
3. Ensure proper CORS headers in API responses

## Debugging Steps

### Step 1: Check Environment Variables

Visit `/test-oauth` to see if all required environment variables are set.

### Step 2: Test Database Connection

The debug endpoint will test database connectivity and show user counts.

### Step 3: Check Browser Console

Look for these console messages during OAuth flow:
- `🔐 NextAuth signIn callback triggered`
- `📡 Connecting to database...`
- `✅ Database connected successfully`
- `👤 Creating new Google user...`
- `✅ New Google user created`

### Step 4: Check Network Tab

Monitor network requests during OAuth:
1. Google OAuth authorization request
2. NextAuth callback request
3. Database operations

### Step 5: Verify User Creation

Check if users are being created in your database with Google IDs.

## Common Error Messages

### "OAuthAccountNotLinked"
- **Cause**: User exists but not linked to Google account
- **Solution**: Link existing account or use different email

### "OAuthSignin"
- **Cause**: Failed to initiate Google sign in
- **Solution**: Check Google OAuth configuration

### "OAuthCallback"
- **Cause**: Google callback failed
- **Solution**: Verify redirect URIs in Google Console

### "OAuthCreateAccount"
- **Cause**: Failed to create account
- **Solution**: Check database connection and user model

## Testing Tools

### 1. Debug Endpoint
Visit `/api/auth/debug` to get comprehensive system information.

### 2. OAuth Test Page
Visit `/test-oauth` to test Google sign in and view debug information.

### 3. Browser Developer Tools
- Check Console for error messages
- Monitor Network tab for failed requests
- Check Application tab for cookies

## Production Checklist

Before deploying to production:

1. ✅ Set production environment variables
2. ✅ Configure Google OAuth for production domain
3. ✅ Set secure `NEXTAUTH_SECRET`
4. ✅ Configure production MongoDB URI
5. ✅ Set `NEXTAUTH_URL` to production domain
6. ✅ Test OAuth flow in production environment
7. ✅ Monitor logs for errors

## Getting Help

If you're still experiencing issues:

1. Check the browser console for error messages
2. Visit `/test-oauth` and share the debug information
3. Check server logs for detailed error messages
4. Verify all environment variables are set correctly
5. Test with a fresh browser session (incognito mode)

## Recent Improvements Made

1. **Enhanced Error Handling**: Added comprehensive error handling in NextAuth callbacks
2. **Better Logging**: Added detailed console logging with emojis for easy identification
3. **Improved User Feedback**: Better error messages for different OAuth scenarios
4. **Debug Tools**: Created debugging endpoints and test pages
5. **Database Validation**: Added checks for database connectivity and user creation
6. **Session Management**: Improved session handling between NextAuth and custom auth

## Quick Fix Commands

```bash
# Clear all cookies (in browser console)
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

# Check environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL
```
