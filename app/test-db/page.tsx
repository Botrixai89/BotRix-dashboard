'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  _id: string
  name: string
  email: string
  createdAt: string
}

export default function TestDBPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to connect to API')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Test - Registered Users</CardTitle>
          <CardDescription>
            This page shows all users registered in MongoDB. Use this to test if data is being stored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={fetchUsers} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Users'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {users.length === 0 && !loading && !error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              No users found. Try registering a new user first.
            </div>
          )}

          {users.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Registered Users ({users.length})</h3>
              {users.map((user) => (
                <div key={user._id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <strong>Name:</strong> {user.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {user.email}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h4 className="font-semibold mb-2">How to test:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="/signup" className="text-blue-600 hover:underline">/signup</a> and register a new user</li>
              <li>Return to this page and click "Refresh Users"</li>
              <li>You should see the new user in the list above</li>
              <li>Check your MongoDB database to confirm data is stored</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 