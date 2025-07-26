'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bot, Lock, Mail, Eye, EyeOff, Facebook, Chrome } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { showSuccess, showError, toastMessages } from '@/lib/toast'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect authenticated users to dashboard
  if (user) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 hero-pattern opacity-30"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex items-center group-hover:scale-110 transition-transform duration-300">
                <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-12 w-auto" />
              </div>
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to BotrixAI</h1>
              <p className="text-gray-600">
                Build intelligent chatbots for your business
              </p>
            </div>
            
            {/* Benefits */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Bot className="h-5 w-5" />
                <span>Intelligent Conversations</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Lock className="h-5 w-5" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-5 w-5" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-teal-600">Sign In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email*
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 border-gray-200 focus:border-teal-300 focus:ring-teal-200 rounded-lg"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password*
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="h-12 pr-12 border-gray-200 focus:border-teal-300 focus:ring-teal-200 rounded-lg"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 text-white border-0 h-12 rounded-lg font-medium hover:bg-teal-700 hover:shadow-lg transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">Or Login using</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-lg flex items-center justify-center space-x-3"
                  disabled={isLoading}
                >
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">f</span>
                  </div>
                  <span className="text-gray-700">Facebook</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-lg flex items-center justify-center space-x-3"
                  disabled={isLoading}
                >
                  <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <span className="text-gray-700">Google</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 