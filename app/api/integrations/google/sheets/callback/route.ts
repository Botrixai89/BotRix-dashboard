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
    const tokenData = await googleIntegrations.exchangeCodeForToken('sheets', code);
    
    // Save integration
    await Integration.createOrUpdate(userId, 'google-sheets', {
      name: 'Google Sheets',
      description: 'Read and write spreadsheet data',
      icon: '📈',
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
          <title>Google Sheets Connected</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', integration: 'google-sheets' }, '*');
            window.close();
          </script>
          <p>Google Sheets connected successfully! You can close this window.</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Sheets OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=oauth_failed`
    );
  }
}
