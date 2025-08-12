'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, [session, status]);

  const checkAuth = async () => {
    // If NextAuth is loading, wait
    if (status === 'loading') {
      console.log('⏳ NextAuth is loading, waiting...')
      return;
    }

    // If NextAuth session exists, use it
    if (status === 'authenticated' && session?.user) {
      console.log('✅ NextAuth session found:', {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        provider: session.user.provider
      })
      
      setUser({
        _id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        avatar: session.user.avatar,
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    // If no NextAuth session, try custom auth
    if (status === 'unauthenticated') {
      console.log('🔍 No NextAuth session, trying custom auth...')
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Custom auth user found:', userData.user)
          setUser(userData.user);
        } else {
          console.log('❌ No custom auth user found')
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, error: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      // Clear user state immediately to prevent race conditions
      setUser(null);
      
      // Clear both authentication systems
      const promises = [];
      
      // Always try to clear custom auth
      promises.push(
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        }).catch(error => {
          console.error('Custom logout error:', error);
        })
      );
      
      // If NextAuth session exists, also clear it
      if (session) {
        // Use NextAuth's built-in signOut function
        promises.push(
          signOut({ 
            redirect: false,
            callbackUrl: '/login'
          }).catch(error => {
            console.error('NextAuth signout error:', error);
          })
        );
        
        // Also call our custom signout endpoint for additional cleanup
        promises.push(
          fetch('/api/auth/signout', {
            method: 'POST',
            credentials: 'include',
          }).catch(error => {
            console.error('Custom NextAuth signout error:', error);
          })
        );
      }
      
      // Wait for all logout requests to complete
      await Promise.all(promises);
      
      // Force clear any remaining cookies on client side
      if (typeof window !== 'undefined') {
        // Clear all auth-related cookies
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = '__Host-next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = '__Secure-next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Ensure user is cleared
      setUser(null);
      
      // Navigate to login page
      if (typeof window !== 'undefined') {
        // Use replace to prevent back navigation
        router.replace('/login');
      }
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      // Check if we're already on the login page to prevent redirect loops
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/forgot-password' && currentPath !== '/reset-password') {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return { user, loading };
} 