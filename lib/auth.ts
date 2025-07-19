import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dbConnect from './mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

// Generate JWT token
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

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Get user from request headers or cookies
export async function getCurrentUser(request: NextRequest): Promise<any> {
  try {
    let token: string | null = null;
    
    // First try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, try to get from cookies
    if (!token) {
      token = getTokenFromCookies(request);
    }
    
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return null;
    }

    await dbConnect();
    const user = await User.findById(payload.userId).select('-password');
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Middleware for protected routes
export async function requireAuth(request: NextRequest): Promise<{ user: any; error?: string }> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return { user: null, error: 'Authentication required' };
  }
  
  return { user };
}

// Check if user owns a resource
export async function requireOwnership(request: NextRequest, resourceUserId: string): Promise<{ user: any; error?: string }> {
  const authResult = await requireAuth(request);
  
  if (authResult.error) {
    return authResult;
  }
  
  if (authResult.user._id.toString() !== resourceUserId) {
    return { user: null, error: 'Access denied' };
  }
  
  return authResult;
}

// Set authentication cookies
export function setAuthCookies(response: NextResponse, token: string): NextResponse {
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  
  return response;
}

// Clear authentication cookies
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('auth-token');
  return response;
}

// Get token from cookies (for SSR)
export function getTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
} 