'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, MessageSquare, User, Clock, Plus, Sparkles, Code, RefreshCw, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSocket } from '@/lib/socket-client'
import { useAuth } from '@/lib/auth-context'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface Conversation {
  _id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: string;
  };
  messageCount: number;
  userMessageCount: number;
  botMessageCount: number;
  userInfo: {
    name?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
  unreadCount: number;
  duration: number;
}

interface Message {
  _id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: string;
}

interface ConversationDetail {
  _id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userInfo: {
    name?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
  botInfo: {
    _id: string;
    name: string;
  };
  messages: Message[];
}

export default function MessagesPage() {
  const params = useParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageError, setMessageError] = useState('')
  const [agentMessage, setAgentMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const { lastMessage, joinBot, sendMessage, isConnected } = useSocket()

  const tabs = [
    { id: 'all', label: 'All', count: conversations.length },
    { id: 'active', label: 'Active', count: conversations.filter(c => c.status === 'active').length },
    { id: 'new', label: 'New', count: conversations.filter(c => c.status === 'new').length },
    { id: 'closed', label: 'Closed', count: conversations.filter(c => c.status === 'closed').length }
  ]

  const fetchConversations = async () => {
    try {
      // Check if bot ID exists
      if (!params.id) {
        console.log('Bot ID not available yet')
        return
      }
      
      setLoading(true)
      setError('')
      
      const queryParams = new URLSearchParams({
        status: activeTab,
        ...(searchQuery && { search: searchQuery })
      })
      
      const response = await fetch(`/api/bots/${params.id}/conversations?${queryParams}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true)
      setMessageError('')
      
      const response = await fetch(`/api/bots/${params.id}/conversations/${conversationId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation messages')
      }
      
      const data = await response.json()
      setConversationDetail(data.conversation)
    } catch (err) {
      console.error('Error fetching conversation messages:', err)
      setMessageError('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchConversations()
    }
  }, [params.id, activeTab, searchQuery])

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationMessages(selectedConversation._id)
    } else {
      setConversationDetail(null)
    }
  }, [selectedConversation])

  // Join bot room for real-time updates
  useEffect(() => {
    if (params.id && isConnected) {
      joinBot(params.id as string)
    }
  }, [params.id, isConnected])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversationDetail?.messages?.length])

  // Listen for new real-time messages
  useEffect(() => {
    if (!lastMessage || !selectedConversation || !conversationDetail) return
    if (lastMessage.conversationId !== selectedConversation._id) return
    // Add new message to conversationDetail
    setConversationDetail(prev => {
      if (!prev) return prev
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            _id: Math.random().toString(36),
            content: lastMessage.message,
            sender: lastMessage.userInfo?.role || 'user',
            timestamp: new Date().toISOString(),
            type: 'text',
          },
        ],
      }
    })
  }, [lastMessage, selectedConversation, conversationDetail])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'all') return true
    return conv.status === activeTab
  })

  // Avatars for sender types
  function getAvatar(sender: string) {
    if (sender === 'user') return <User className="h-6 w-6 text-blue-500 bg-blue-100 rounded-full p-1" />
    if (sender === 'bot') return <Sparkles className="h-6 w-6 text-teal-500 bg-teal-100 rounded-full p-1" />
    if (sender === 'agent') return <Badge className="h-6 w-6 text-green-600 bg-green-100 rounded-full p-1">A</Badge>
    return <User className="h-6 w-6 text-gray-400 bg-gray-100 rounded-full p-1" />
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Manage conversations with your bot users</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-teal-200 text-teal-600 hover:bg-teal-50"
              onClick={fetchConversations}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" disabled className="bg-teal-600 text-white border-0 hover:bg-teal-700">
              Mark All as Read
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
                      <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10 border-gray-200 focus:border-teal-300 focus:ring-teal-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchConversations()
                  }
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  {tab.label}
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 text-xs ${
                      activeTab === tab.id 
                        ? 'bg-white/20 text-white hover:bg-white/20' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 text-teal-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading conversations...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-red-600 mb-2">{error}</p>
                  <Button size="sm" onClick={fetchConversations} className="bg-teal-600 text-white border-0 hover:bg-teal-700">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="relative mb-6">
                  <div className="p-4 rounded-full bg-blue-100 text-blue-600">
                    <MessageSquare className="h-12 w-12" />
                  </div>
                  <div className="absolute -top-1 -right-1 p-1 rounded-full bg-yellow-400">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No conversations yet
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm leading-relaxed">
                  Once users start chatting with your bot, their conversations will appear here.
                </p>
                <Link href={`/dashboard/bots/${params.id}/embed`}>
                  <Button size="sm" className="bg-teal-600 text-white border-0 hover:bg-teal-700">
                    <Code className="h-4 w-4 mr-2" />
                    Get Embed Code
                  </Button>
                </Link>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`p-4 border-b border-purple-50 cursor-pointer hover:bg-purple-25 transition-colors ${
                    selectedConversation?._id === conversation._id ? 'bg-purple-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.userInfo?.name || 'Anonymous User'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="text-xs bg-red-500 text-white">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || 'No messages'}
                      </p>
                      
                      <div className="flex items-center justify-between mt-1">
                        <Badge 
                          variant={conversation.status === 'active' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            conversation.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : conversation.status === 'new'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {conversation.status}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {conversation.lastMessage?.timestamp ? formatTime(conversation.lastMessage.timestamp) : 'Just now'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {conversation.messageCount} messages
                        </span>
                        <span className="text-xs text-gray-500">
                          {conversation.userMessageCount} user • {conversation.botMessageCount} bot
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {selectedConversation ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Chat Header */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.userInfo?.name || 'Anonymous User'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.messageCount} messages • Started {formatTime(selectedConversation.createdAt)}
                    </p>
                  </div>
                  <Badge 
                    variant={selectedConversation.status === 'active' ? 'default' : 'secondary'}
                    className={`text-xs ${
                      selectedConversation.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedConversation.status === 'new'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {selectedConversation.status}
                  </Badge>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 relative overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-blue-50 px-0 md:px-6 py-4 md:py-6 rounded-xl shadow-inner transition-all duration-300" style={{scrollBehavior:'smooth'}}>
                {/* Fade top */}
                <div className="pointer-events-none absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-white/80 to-transparent z-10" />
                {/* Fade bottom */}
                <div className="pointer-events-none absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white/80 to-transparent z-10" />
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading messages...</p>
                    </div>
                  </div>
                ) : messageError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-red-600 mb-2">{messageError}</p>
                      <Button size="sm" onClick={() => fetchConversationMessages(selectedConversation._id)} className="bg-teal-600 text-white border-0 hover:bg-teal-700">
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : conversationDetail && conversationDetail.messages.length > 0 ? (
                  <div className="flex flex-col gap-3 md:gap-4 pb-8">
                    {conversationDetail.messages.map((message, index) => {
                      const isUser = message.sender === 'user'
                      const isBot = message.sender === 'bot'
                      const isAgent = message.sender === 'agent'
                      return (
                        <div
                          key={message._id || index}
                          className={cn(
                            'group flex items-end gap-2 md:gap-3',
                            isUser ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {/* Avatar */}
                          {!isUser && (
                            <div className="flex-shrink-0">{getAvatar(message.sender)}</div>
                          )}
                          {/* Bubble */}
                          <div
                            className={cn(
                              'relative max-w-[80vw] md:max-w-md px-4 py-2 rounded-2xl shadow-sm transition-all duration-200',
                              isUser
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                                : isAgent
                                ? 'bg-gradient-to-r from-green-400 to-green-200 text-white rounded-bl-md'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md',
                              'hover:shadow-lg'
                            )}
                          >
                            <p className="text-sm whitespace-pre-line break-words">{message.content}</p>
                            <span className={cn(
                              'absolute text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                              isUser ? 'right-2 bottom-1 text-purple-100' : 'left-2 bottom-1 text-gray-400'
                            )}>
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                          {/* Avatar for user on right */}
                          {isUser && (
                            <div className="flex-shrink-0">{getAvatar(message.sender)}</div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No messages in this conversation</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Agent Message Input - sticky */}
              <div className="sticky bottom-0 left-0 w-full z-20 bg-white/90 border-t flex items-center gap-2 px-4 py-3 md:px-6 shadow-lg rounded-b-xl">
                <Input
                  placeholder="Type a message as agent..."
                  value={agentMessage}
                  onChange={e => setAgentMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendAgentMessage()
                  }}
                  className="flex-1 bg-gray-50 border-gray-200 focus:border-purple-300 focus:ring-purple-200 rounded-full px-4 py-2"
                  disabled={!isConnected || loadingMessages}
                />
                <Button
                  onClick={handleSendAgentMessage}
                  disabled={!agentMessage.trim() || !isConnected || loadingMessages}
                  className="bg-teal-600 text-white border-0 rounded-full px-6 py-2 shadow-md hover:scale-105 transition-transform hover:bg-teal-700"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/50 to-purple-50/50">
              <div className="text-center max-w-lg mx-auto p-8">
                <div className="relative mb-8">
                  <div className="p-6 rounded-full bg-teal-600 mx-auto w-fit">
                    <MessageSquare className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 p-2 rounded-full bg-yellow-400">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to your Messages Hub
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  This is where you'll manage all conversations with your bot users. 
                  Get started by adding the chat widget to your website and watch the magic happen!
                </p>
                <div className="space-y-4">
                  <Link href={`/dashboard/bots/${params.id}/embed`}>
                    <Button className="bg-teal-600 text-white border-0 px-8 py-3 hover:bg-teal-700 hover:shadow-lg hover:scale-105 transition-all">
                      <Code className="h-5 w-5 mr-2" />
                      Get Embed Code
                    </Button>
                  </Link>
                  <p className="text-sm text-gray-500">
                    Or test your bot's webhook integration first
                  </p>
                </div>
                
                {/* Features preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Real-time Chat</p>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <User className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">User Management</p>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Filter className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Smart Filtering</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/50 to-purple-50/50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <p className="text-gray-500">
                  Select a conversation to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // --- Handler for agent send message ---
  function handleSendAgentMessage() {
    if (!agentMessage.trim() || !selectedConversation || !user) return
    // Optimistically update UI
    setConversationDetail(prev => {
      if (!prev) return prev
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            _id: Math.random().toString(36),
            content: agentMessage,
            sender: 'agent',
            timestamp: new Date().toISOString(),
            type: 'text',
          },
        ],
      }
    })
    // Send via socket
    sendMessage(
      params.id as string,
      selectedConversation._id,
      agentMessage,
      { role: 'agent', name: user.name, userId: user._id }
    )
    setAgentMessage('')
  }
} 