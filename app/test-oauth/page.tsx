'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn, useSession } from 'next-auth/react'
import { showSuccess, showError } from '@/lib/toast'

export default function TestOAuthPage() {
  const { data: session, status } = useSession()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      console.log('🔐 Testing Google sign in...')
      
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false
      })
      
      console.log('📡 Google sign in result:', result)
      
      if (result?.error) {
        showError(`Google sign in failed: ${result.error}`)
      } else if (result?.ok) {
        showSuccess('Google sign in successful!')
      } else {
        showSuccess('Google sign in initiated')
      }
    } catch (error) {
      console.error('❌ Google sign in error:', error)
      showError('Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDebugInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/debug', {
        credentials: 'include'
      })
      const data = await response.json()
      setDebugInfo(data)
      console.log('🔍 Debug info:', data)
    } catch (error) {
      console.error('❌ Debug fetch error:', error)
      showError('Failed to fetch debug info')
    } finally {
      setIsLoading(false)
    }
  }

  const testAuth = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/test', {
        credentials: 'include'
      })
      const data = await response.json()
      setDebugInfo(data)
      console.log('🧪 Auth test result:', data)
    } catch (error) {
      console.error('❌ Auth test error:', error)
      showError('Failed to test authentication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>OAuth Authentication Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={testGoogleSignIn}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Testing...' : 'Test Google Sign In'}
              </Button>
              
              <Button 
                onClick={fetchDebugInfo}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Fetching...' : 'Fetch Debug Info'}
              </Button>

              <Button 
                onClick={testAuth}
                disabled={isLoading}
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? 'Testing...' : 'Test Auth'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Session Status</h3>
                <p>Status: {status}</p>
                <p>Has Session: {session ? 'Yes' : 'No'}</p>
                {session && (
                  <div className="mt-2">
                    <p>User: {session.user?.name}</p>
                    <p>Email: {session.user?.email}</p>
                    <p>Provider: {session.user?.provider || 'Unknown'}</p>
                  </div>
                )}
              </div>

              {debugInfo && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-semibold mb-2">Debug Information</h3>
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
