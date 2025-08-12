'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { showSuccess, showError, toastMessages } from '@/lib/toast'
import { useAuth } from '@/lib/auth-context'
import { signIn, useSession } from 'next-auth/react'
import { Loading } from '@/components/ui/loading'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for OAuth errors in URL
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'OAuthAccountNotLinked') {
      showError('This Google account is not linked to any existing account. Please sign up first or use a different email.')
    }
  }, [searchParams])

  // Combined redirect effect to handle both auth systems
  useEffect(() => {
    // Only redirect if we have a user and NextAuth is not loading
    if (!loading && status !== 'loading' && (user || (status === 'authenticated' && session))) {
      // Add a small delay to ensure session is fully established
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [user, loading, status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        showSuccess(toastMessages.loginSuccess)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        showError(result.error || toastMessages.loginFailed)
      }
    } catch (error) {
      console.error('Login error:', error)
      showError(toastMessages.networkError)
    }
    
    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      console.log('🔐 Initiating Google sign in from login...')
      
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false
      })
      
      console.log('📡 Google sign in result:', result)
      
      if (result?.error) {
        console.error('❌ Google sign in error:', result.error)
        
        // Handle specific error cases
        switch (result.error) {
          case 'OAuthAccountNotLinked':
            showError('This Google account is not linked to any existing account. Please sign up first or use a different email.')
            break
          case 'OAuthSignin':
            showError('Failed to initiate Google sign in. Please try again.')
            break
          case 'OAuthCallback':
            showError('Google sign in callback failed. Please try again.')
            break
          case 'OAuthCreateAccount':
            showError('Failed to create account with Google. Please try again.')
            break
          case 'EmailCreateAccount':
            showError('Failed to create account with this email. Please try a different email.')
            break
          case 'Callback':
            showError('Authentication callback failed. Please try again.')
            break
          case 'SessionRequired':
            showError('Session required. Please try signing in again.')
            break
          default:
            showError(`Google sign in failed: ${result.error}`)
        }
      } else if (result?.ok) {
        console.log('✅ Google sign in successful, redirecting...')
        showSuccess('Google sign in successful! Redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        console.log('⏳ Google sign in in progress...')
        // The sign in is still in progress, NextAuth will handle the redirect
      }
    } catch (error) {
      console.error('❌ Google sign in error:', error)
      showError('Failed to sign in with Google. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
  }

  // Show loading while checking authentication
  if (loading || status === 'loading') {
    return <Loading variant="fullscreen" text="Loading..." />
  }

  // Don't render the form if user is authenticated (redirect will happen in useEffect)
  if (user || (status === 'authenticated' && session)) {
    return <Loading variant="fullscreen" text="Preparing your dashboard..." />
  }

  return (
    <div className="min-h-screen bg-[#E0FFFF] relative">
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
          {/* Login Card - Compact */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="text-center pb-3 sm:pb-4">
              <div className="flex justify-center mb-2">
                <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-8 w-auto sm:h-10" />
              </div>
              <CardTitle className="text-lg sm:text-xl text-teal-600">Sign In</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                    Email*
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-8 sm:h-9 border-gray-200 focus:border-teal-300 focus:ring-teal-200 rounded-lg text-xs sm:text-sm"
                    required
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-gray-700">
                    Password*
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="h-8 sm:h-9 pr-8 border-gray-200 focus:border-teal-300 focus:ring-teal-200 rounded-lg text-xs sm:text-sm"
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <Link href="/forgot-password" className="text-xs text-gray-600 hover:text-teal-600 transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 text-white border-0 h-8 sm:h-9 rounded-lg font-medium hover:bg-teal-700 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-8 sm:h-9 border-gray-200 hover:bg-gray-50 rounded-lg flex items-center justify-center space-x-2 text-xs sm:text-sm"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700">Continue with Google</span>
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 