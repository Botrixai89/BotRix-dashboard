'use client'

import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const { user, loading, login, logout } = useAuth()
  const [testResult, setTestResult] = useState('')

  const testAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      const data = await response.json()
      setTestResult(`Status: ${response.status}, Data: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setTestResult(`Error: ${error}`)
    }
  }

  const testLogin = async () => {
    const result = await login('test@example.com', 'password123')
    setTestResult(`Login result: ${JSON.stringify(result, null, 2)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}
            </div>
            
            <div className="space-y-2">
              <Button onClick={testAuth}>Test /api/auth/me</Button>
              <Button onClick={testLogin}>Test Login</Button>
              <Button onClick={logout}>Logout</Button>
            </div>
            
            {testResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <pre className="text-sm">{testResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 