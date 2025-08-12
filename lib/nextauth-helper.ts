import { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';
import dbConnect from './mongodb';
import User from '@/models/User';

export async function getNextAuthUser(request: NextRequest) {
  try {
    // Get NextAuth session token from cookies
    const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                         request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (!nextAuthToken) {
      console.log('❌ No NextAuth token found in cookies');
      return null;
    }

    console.log('🎫 Found NextAuth token, attempting to decode...');
    
    // Decode the NextAuth token
    const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'your-nextauth-secret';
    const payload = await decode({
      token: nextAuthToken,
      secret: NEXTAUTH_SECRET,
    });
    
    console.log('🔍 NextAuth token payload:', {
      hasPayload: !!payload,
      hasEmail: !!payload?.email,
      hasId: !!payload?.id,
      hasSub: !!payload?.sub,
      payloadKeys: payload ? Object.keys(payload) : []
    });
    
    if (!payload) {
      console.log('❌ Failed to decode NextAuth token');
      return null;
    }
    
    // Get user ID from payload
    const userId = payload.id || payload.sub;
    const email = payload.email;
    
    if (!userId && !email) {
      console.log('❌ No user identifier found in NextAuth token');
      return null;
    }
    
    console.log('📧 Found user identifier:', { userId, email });
    
    // Connect to database and find user
    await dbConnect();
    
    let user = null;
    if (userId) {
      user = await User.findById(userId).select('-password');
    }
    if (!user && email) {
      user = await User.findOne({ email: email }).select('-password');
    }
    
    if (user) {
      console.log('✅ Found user from NextAuth token:', { id: user._id, email: user.email });
      return user;
    } else {
      console.log('❌ User not found in database for:', { userId, email });
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error getting NextAuth user:', error);
    return null;
  }
}
