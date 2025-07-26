'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Bot, Sparkles, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { showSuccess, showError } from '@/lib/toast'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await forgotPassword(email)
      
      if (result.success) {
        showSuccess(result.error || 'Password reset link sent to your email')
        setIsSubmitted(true)
      } else {
        showError(result.error || 'Failed to send reset link')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      showError('Network error. Please try again.')
    }
    
    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-30"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="flex items-center group-hover:scale-110 transition-transform duration-300">
                  <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-10 w-auto" />
                </div>
              </Link>
            </div>

            <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription className="text-gray-600">
                  We've sent a password reset link to your email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    If an account with the email <strong>{email}</strong> exists, 
                    you'll receive a password reset link shortly.
                  </p>
                  <p className="text-sm text-gray-500">
                    Don't see the email? Check your spam folder or try again.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => setIsSubmitted(false)}
                    className="w-full gradient-primary text-white border-0 h-11 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                  >
                    Try again
                  </Button>
                  
                  <Link href="/">
                    <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all h-11">
                      Back to login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      <div className="absolute inset-0 hero-pattern opacity-30"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex items-center group-hover:scale-110 transition-transform duration-300">
                <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-12 w-auto" />
              </div>
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Forgot your password?</h1>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>
            
            {/* Benefits */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Secure reset
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="w-4 h-4 text-green-500" />
                Quick & easy
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-teal-600">
                  <Bot className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">Reset your password</CardTitle>
              <CardDescription className="text-gray-600">
                We'll send you a secure link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>
                
                              <Button 
                type="submit" 
                className="w-full bg-teal-600 text-white border-0 h-11 hover:bg-teal-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300" 
                disabled={isLoading}
              >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Remember your password?</span>
                </div>
              </div>

              <div className="text-center">
                <Link href="/login">
                  <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all h-11">
                    Back to login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 