'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bot, ArrowLeft, Lock, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { showSuccess, showError, toastMessages } from '@/lib/toast'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 hero-pattern opacity-30"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-3 rounded-xl gradient-primary group-hover:scale-110 transition-transform duration-300">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-bold gradient-text">Botrix</span>
            </Link>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600">
                Sign in to access your chatbot dashboard
              </p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl">Sign in to your account</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your credentials to continue
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
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 h-11 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 h-11 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-white border-0 h-11 hover:shadow-lg hover:scale-[1.02] transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="text-center">
                <Link href="#" className="text-sm text-purple-600 hover:text-purple-500 hover:underline transition-colors">
                  Forgot your password?
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">New to Botrix?</span>
                </div>
              </div>

              <div className="text-center">
                <Link href="/signup">
                  <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all h-11">
                    Create your account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
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