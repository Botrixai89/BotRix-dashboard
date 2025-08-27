'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const { user, loading, login, signup, logout } = useAuth()
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testAuthMe = async () => {
    try {
      addResult('Testing /api/auth/me...')
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        addResult(`✅ /api/auth/me successful: ${data.user?.email}`)
      } else {
        addResult(`❌ /api/auth/me failed: ${data.error}`)
      }
    } catch (error) {
      addResult(`❌ /api/auth/me error: ${error}`)
    }
  }

  const testBots = async () => {
    try {
      addResult('Testing /api/bots...')
      const response = await fetch('/api/bots', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        addResult(`✅ /api/bots successful: ${data.bots?.length || 0} bots`)
      } else {
        addResult(`❌ /api/bots failed: ${data.error}`)
      }
    } catch (error) {
      addResult(`❌ /api/bots error: ${error}`)
    }
  }

  const testCookies = () => {
    addResult('Checking cookies...')
    const cookies = document.cookie.split(';').map(c => c.trim())
    const authCookies = cookies.filter(c => 
      c.includes('auth-token') || 
      c.includes('next-auth') || 
      c.includes('token')
    )
    addResult(`Found cookies: ${authCookies.join(', ') || 'none'}`)
  }

  const runAllTests = async () => {
    setIsTesting(true)
    setTestResults([])
    
    addResult('Starting authentication tests...')
    addResult(`Auth Context - User: ${user?.email || 'none'}, Loading: ${loading}`)
    addResult(`NextAuth - Status: ${status}, Session: ${session?.user?.email || 'none'}`)
    
    await testCookies()
    await testAuthMe()
    await testBots()
    
    addResult('Tests completed!')
    setIsTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Auth Context State</h3>
                <div className="text-sm space-y-1">
                  <p>User: {user?.email || 'None'}</p>
                  <p>Loading: {loading ? 'Yes' : 'No'}</p>
                  <p>User ID: {user?._id || 'None'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">NextAuth State</h3>
                <div className="text-sm space-y-1">
                  <p>Status: {status}</p>
                  <p>Session: {session?.user?.email || 'None'}</p>
                  <p>Session ID: {session?.user?.id || 'None'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={runAllTests} 
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button onClick={testCookies} variant="outline" size="sm">
                  Test Cookies
                </Button>
                <Button onClick={testAuthMe} variant="outline" size="sm">
                  Test /api/auth/me
                </Button>
                <Button onClick={testBots} variant="outline" size="sm">
                  Test /api/bots
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 