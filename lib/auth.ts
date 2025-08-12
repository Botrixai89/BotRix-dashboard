import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dbConnect from './mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export function generateToken(user: { _id: string; email: string; name: string }): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getCurrentUser(request: NextRequest): Promise<any> {
  try {
    console.log('🔍 Getting current user from request...')
    
    // First, try to get user from NextAuth session
    const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                         request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (nextAuthToken) {
      console.log('🎫 Found NextAuth token, attempting to extract user info...')
      try {
        // Use NextAuth's built-in JWT decoding
        const { decode } = require('next-auth/jwt');
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
          hasIat: !!payload?.iat,
          hasExp: !!payload?.exp,
          payloadKeys: payload ? Object.keys(payload) : []
        })
        
        // Try different ways to get the user ID or email
        let userId = payload?.id || payload?.sub || null;
        let email = payload?.email || null;
        
        if (userId || email) {
          console.log('📧 Found user identifier in NextAuth token:', { userId, email })
          await dbConnect();
          
          let user = null;
          if (userId) {
            user = await User.findById(userId).select('-password');
          }
          if (!user && email) {
            user = await User.findOne({ email: email }).select('-password');
          }
          
          if (user) {
            console.log('✅ Found user from NextAuth token:', { id: user._id, email: user.email })
            return user;
          } else {
            console.log('❌ User not found in database for:', { userId, email })
          }
        } else {
          console.log('❌ No user identifier found in NextAuth token')
        }
      } catch (error) {
        console.error('❌ NextAuth token processing failed:', error);
        // Continue to try custom JWT token
      }
    } else {
      console.log('❌ No NextAuth token found in cookies')
    }

    // If no NextAuth session, try custom JWT token
    console.log('🔍 Trying custom JWT token...')
    let token: string | null = null;
    
    // Check Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔑 Found token in Authorization header')
    } else {
      // Check cookies
      token = getTokenFromCookies(request);
      if (token) {
        console.log('🍪 Found token in cookies')
      }
    }
    
    if (!token) {
      console.log('❌ No custom JWT token found')
      return null;
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      console.log('❌ Custom JWT token verification failed')
      return null;
    }
    
    console.log('✅ Custom JWT token verified, fetching user...')
    await dbConnect();
    const user = await User.findById(payload.userId).select('-password');
    if (user) {
      console.log('✅ Found user from custom JWT token:', { id: user._id, email: user.email })
    }
    return user;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    console.log('🔐 Requiring authentication...')
    const user = await getCurrentUser(request);
    
    if (!user) {
      console.log('❌ No user found, authentication required')
      return { user: null, error: 'Authentication required' };
    }
    
    console.log('✅ Authentication successful for user:', { id: user._id, email: user.email })
    return { user };
  } catch (error) {
    console.error('❌ Auth requirement check failed:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

export function setAuthCookies(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
  
  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  // Clear custom auth token
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  // Clear NextAuth session cookies
  response.cookies.set('next-auth.session-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  response.cookies.set('__Secure-next-auth.session-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  // Clear CSRF tokens
  response.cookies.set('next-auth.csrf-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  response.cookies.set('__Host-next-auth.csrf-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  // Clear callback URLs
  response.cookies.set('next-auth.callback-url', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  response.cookies.set('__Secure-next-auth.callback-url', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  return response;
}

export function getTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  // Optional: Add more password strength requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter');
  // }
  // if (!/[a-z]/.test(password)) {
  //   errors.push('Password must contain at least one lowercase letter');
  // }
  // if (!/\d/.test(password)) {
  //   errors.push('Password must contain at least one number');
  // }
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push('Password must contain at least one special character');
  // }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 