'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { showSuccess, showError } from '@/lib/toast'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsValidToken(false)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!token) {
      showError('Invalid reset token')
      setIsLoading(false)
      return
    }

    try {
      const result = await resetPassword(token, formData.password)
      
      if (result.success) {
        showSuccess('Password reset successfully')
        setIsSuccess(true)
      } else {
        showError(result.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      showError('Network error. Please try again.')
    }
    
    setIsLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
  }

  if (!isValidToken) {
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
                  <AlertCircle className="w-16 h-16 text-red-500" />
                </div>
                <CardTitle className="text-xl">Invalid reset link</CardTitle>
                <CardDescription className="text-gray-600">
                  This password reset link is invalid or has expired
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Please request a new password reset link from the login page.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/forgot-password">
                    <Button className="w-full gradient-primary text-white border-0 h-11 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                      Request new reset link
                    </Button>
                  </Link>
                  
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

  if (isSuccess) {
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
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <CardTitle className="text-xl">Password reset successful</CardTitle>
                <CardDescription className="text-gray-600">
                  Your password has been reset successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    You can now log in with your new password.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/">
                    <Button className="w-full gradient-primary text-white border-0 h-11 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                      Go to login
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
              <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="text-gray-600">
                Enter your new password below
              </p>
            </div>
          </div>

          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl">Create new password</CardTitle>
              <CardDescription className="text-gray-600">
                Your new password must be at least 8 characters long
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 h-11 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
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
                  {isLoading ? 'Resetting...' : 'Reset password'}
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