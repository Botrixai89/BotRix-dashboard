'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle } from 'lucide-react'
import { showSuccess, showError, toastMessages } from '@/lib/toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess('Password reset link sent to your email')
        setIsSubmitted(true)
      } else {
        showError(data.error || 'Failed to send reset link')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      showError('Network error. Please try again.')
    }
    
    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#E0FFFF] relative">
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="text-center pb-3 sm:pb-4">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl">Check your email</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  We've sent a password reset link to your email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    If an account with the email <strong>{email}</strong> exists, 
                    you'll receive a password reset link shortly.
                  </p>
                  <p className="text-xs text-gray-500">
                    Don't see the email? Check your spam folder or try again.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={() => setIsSubmitted(false)}
                    className="w-full bg-teal-600 text-white border-0 h-8 sm:h-9 hover:bg-teal-700 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm"
                  >
                    Try again
                  </Button>
                  
                  <Link href="/login">
                    <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 transition-all h-8 sm:h-9 text-xs sm:text-sm">
                      Back to login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E0FFFF] relative">
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="text-center pb-3 sm:pb-4">
              <div className="flex justify-center mb-2">
                <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-8 w-auto sm:h-10" />
              </div>
              <CardTitle className="text-lg sm:text-xl text-teal-600">Forgot Password</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                    Email Address*
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 sm:h-9 border-gray-200 focus:border-teal-300 focus:ring-teal-200 rounded-lg text-xs sm:text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 text-white border-0 h-8 sm:h-9 rounded-lg font-medium hover:bg-teal-700 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-600">
                  Remember your password?{' '}
                  <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                    Sign in
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