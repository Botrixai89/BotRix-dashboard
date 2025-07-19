'use client'

import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestSignupPage() {
  const { signup } = useAuth()
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  })
  const [result, setResult] = useState('')

  const handleSignup = async () => {
    const signupResult = await signup(formData.name, formData.email, formData.password)
    setResult(JSON.stringify(signupResult, null, 2))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Signup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={formData.email} 
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            
            <Button onClick={handleSignup}>Create Test Account</Button>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <pre className="text-sm">{result}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 