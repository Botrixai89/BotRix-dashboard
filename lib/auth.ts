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
    let token: string | null = null;
    
    // Check Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check cookies
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

export async function requireAuth(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return { user: null, error: 'Authentication required' };
    }
    
    return { user };
  } catch (error) {
    console.error('Auth requirement check failed:', error);
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
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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

export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 