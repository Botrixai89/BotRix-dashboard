import { NextRequest, NextResponse } from 'next/server';
import { googleIntegrations } from '@/lib/google-integrations';
import Integration from '@/models/Integration';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=oauth_denied`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=no_code`
      );
    }

    await connectToDatabase();

    // Parse state to get user ID
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state || '', 'base64').toString());
      userId = stateData.userId;
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=invalid_state`
      );
    }

    // Exchange code for token
    const tokenData = await googleIntegrations.exchangeCodeForToken('analytics', code);
    
    // Save integration
    await Integration.createOrUpdate(userId, 'google-analytics', {
      name: 'Google Analytics',
      description: 'Track website traffic and user behavior',
      icon: '📊',
      status: 'connected',
      config: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
      }
    });

    // Close popup and redirect
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Analytics Connected</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', integration: 'google-analytics' }, '*');
            window.close();
          </script>
          <p>Google Analytics connected successfully! You can close this window.</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Analytics OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=oauth_failed`
    );
  }
}
