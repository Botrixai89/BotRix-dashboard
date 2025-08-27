'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Users, Mail, UserPlus, Settings, Trash2, Edit, 
  Shield, Eye, MessageSquare, BarChart3, Download, MoreVertical,
  CheckCircle, Clock, XCircle, ArrowLeft
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { showSuccess, showError } from '@/lib/toast'
import { Loading } from '@/components/ui/loading'

interface TeamMember {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  role: 'admin' | 'editor' | 'agent' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  invitedAt: string;
  acceptedAt?: string;
  lastActive?: string;
  permissions: string[];
}

interface Bot {
  _id: string;
  name: string;
  status: string;
}

export default function TeamPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState<string>('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'agent' | 'viewer'>('agent')
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    fetchBots()
  }, [])

  useEffect(() => {
    if (selectedBot) {
      fetchTeamMembers(selectedBot)
    }
  }, [selectedBot])

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/bots')
      const result = await response.json()

      if (response.ok) {
        setBots(result.bots || [])
        if (result.bots && result.bots.length > 0) {
          setSelectedBot(result.bots[0]._id)
        }
      } else {
        showError(result.error || 'Failed to fetch bots')
      }
    } catch (err) {
      showError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamMembers = async (botId: string) => {
    try {
      const response = await fetch(`/api/bots/${botId}/team`)
      const result = await response.json()

      if (response.ok) {
        setTeamMembers(result.members || [])
      } else {
        showError(result.error || 'Failed to fetch team members')
      }
    } catch (err) {
      showError('Network error. Please try again.')
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !selectedBot) return

    setIsInviting(true)
    try {
      const response = await fetch(`/api/bots/${selectedBot}/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        }),
      })

      const result = await response.json()

      if (response.ok) {
        showSuccess('Team member invited successfully!')
        setInviteEmail('')
        setShowInviteForm(false)
        fetchTeamMembers(selectedBot)
      } else {
        showError(result.error || 'Failed to invite team member')
      }
    } catch (err) {
      showError('Network error. Please try again.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const response = await fetch(`/api/bots/${selectedBot}/team/${memberId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        showSuccess('Team member removed successfully!')
        fetchTeamMembers(selectedBot)
      } else {
        showError(result.error || 'Failed to remove team member')
      }
    } catch (err) {
      showError('Network error. Please try again.')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'agent': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'inactive': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading size="lg" text="Loading team management..." />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600">Manage your bot team members and permissions</p>
            </div>
          </div>
        </div>

        {/* Bot Selection */}
        {bots.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Select Bot</CardTitle>
              <CardDescription>Choose which bot's team to manage</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={selectedBot}
                onChange={(e) => setSelectedBot(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {bots.map((bot) => (
                  <option key={bot._id} value={bot._id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {selectedBot && (
          <>
            {/* Invite New Member */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Invite Team Member</CardTitle>
                    <CardDescription>Add new members to your bot team</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {showInviteForm ? 'Cancel' : 'Invite Member'}
                  </Button>
                </div>
              </CardHeader>
              {showInviteForm && (
                <CardContent>
                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as any)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="agent">Agent</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowInviteForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isInviting || !inviteEmail.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isInviting ? 'Inviting...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              )}
            </Card>

            {/* Team Members List */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>
                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                    <p className="text-gray-600 mb-4">Invite your first team member to get started</p>
                    <Button
                      onClick={() => setShowInviteForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {member.userId.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">{member.userId.name}</h3>
                              <Badge className={getRoleColor(member.role)}>
                                {member.role}
                              </Badge>
                              <Badge className={getStatusColor(member.status)}>
                                {getStatusIcon(member.status)}
                                <span className="ml-1">{member.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{member.userId.email}</p>
                            <p className="text-xs text-gray-500">
                              Invited {new Date(member.invitedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Permissions Guide */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Role Permissions</CardTitle>
                <CardDescription>Understand what each role can do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="h-5 w-5 text-red-600" />
                      <h4 className="font-medium text-gray-900">Admin</h4>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Full bot management</li>
                      <li>• Team management</li>
                      <li>• All conversations</li>
                      <li>• Analytics & exports</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Edit className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-gray-900">Editor</h4>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Edit bot settings</li>
                      <li>• Reply to conversations</li>
                      <li>• View analytics</li>
                      <li>• Export data</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-gray-900">Agent</h4>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Reply to conversations</li>
                      <li>• Assign conversations</li>
                      <li>• View analytics</li>
                      <li>• Basic bot access</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Eye className="h-5 w-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Viewer</h4>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• View conversations</li>
                      <li>• View analytics</li>
                      <li>• Read-only access</li>
                      <li>• No editing</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
