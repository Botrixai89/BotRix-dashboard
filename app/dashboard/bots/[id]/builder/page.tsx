'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Edit, Trash2, MessageSquare, Save, Settings, Zap, Globe, Palette, TestTube, 
  AlertTriangle, CheckCircle, XCircle, Volume2, VolumeX, Play, Pause, Search, 
  ArrowRight, Copy, MoreVertical, Image, Clock, User, Home, FileText, Share2,
  ChevronDown, ChevronRight, RotateCcw, X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { showSuccess, showError } from '@/lib/toast'
import { getVoiceService } from '@/lib/voice-service'
import { Loading, ButtonLoading } from '@/components/ui/loading'

interface Bot {
  _id: string;
  name: string;
  status: string;
  settings: {
    webhookUrl: string;
    welcomeMessage: string;
    fallbackMessage: string;
    primaryColor: string;
    widgetIcon?: string;
    widgetIconType: string;
    widgetIconEmoji: string;
    voiceEnabled: boolean;
    voiceSettings: {
      voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      speed: number;
      pitch: number;
      language: string;
    };
  };
}

interface TestResult {
  webhookTest: {
    status: string;
    message: string;
    statusCode?: number;
    response?: any;
    error?: string;
  };
}

interface FlowNode {
  id: string;
  type: 'welcome' | 'message' | 'image' | 'pause' | 'condition' | 'webhook';
  title: string;
  content: string;
  position: { x: number; y: number };
  connections: string[];
}

interface Path {
  id: string;
  name: string;
  nodes: FlowNode[];
  isActive: boolean;
}

export default function BuilderPage() {
  const params = useParams()
  const [bot, setBot] = useState<Bot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  
  // New state for the flow builder
  const [activeSection, setActiveSection] = useState('canvas')
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [paths, setPaths] = useState<Path[]>([
    {
      id: 'welcome-new-user',
      name: 'Welcome new user',
      isActive: true,
      nodes: []
    },
    {
      id: 'greet-returning-user',
      name: 'Greet returning user',
      isActive: false,
      nodes: []
    },
    {
      id: 'default-message',
      name: 'Default Message',
      isActive: false,
      nodes: []
    },
    {
      id: 'post-resolution',
      name: 'Post resolution',
      isActive: false,
      nodes: []
    },
    {
      id: 'agent-unavailable',
      name: 'Agent Unavailable',
      isActive: false,
      nodes: []
    }
  ])
  const [selectedPath, setSelectedPath] = useState(paths[0])
  const [expandedSections, setExpandedSections] = useState<string[]>(['paths'])

  // Form state
  const [formData, setFormData] = useState({
    webhookUrl: '',
    welcomeMessage: '',
    fallbackMessage: '',
    primaryColor: '',
    widgetIcon: '',
    widgetIconType: 'default', // string, not a union type
    widgetIconEmoji: '💬',
    voiceEnabled: false,
    voiceSettings: {
      voice: 'alloy' as const,
      speed: 1.0,
      pitch: 1.0,
      language: 'en-US'
    },
    headerColor: '#8b5cf6',
    footerColor: '#f8fafc',
    bodyColor: '#ffffff',
    logo: '',
    widgetImages: [''] as string[]
  })

  useEffect(() => {
    fetchBot()
  }, [params.id])

  useEffect(() => {
    // Initialize paths only once when bot data is first loaded
    if (bot && paths.length > 0 && paths[0].nodes.length === 0) {
      initializeDefaultPaths()
    }
  }, [bot, formData.welcomeMessage, formData.fallbackMessage])

  const fetchBot = async () => {
    try {
      const response = await fetch(`/api/bots/${params.id}`)
      const result = await response.json()

      if (response.ok) {
        setBot(result.bot)
        setFormData({
          webhookUrl: result.bot.settings?.webhookUrl || '',
          welcomeMessage: result.bot.settings?.welcomeMessage || '',
          fallbackMessage: result.bot.settings?.fallbackMessage || '',
          primaryColor: result.bot.settings?.primaryColor || '#7c3aed',
          widgetIcon: result.bot.settings?.widgetIcon || '',
          widgetIconType: result.bot.settings?.widgetIconType || 'default',
          widgetIconEmoji: result.bot.settings?.widgetIconEmoji || '💬',
          voiceEnabled: result.bot.settings?.voiceEnabled || false,
          voiceSettings: {
            voice: result.bot.settings?.voiceSettings?.voice || 'alloy',
            speed: result.bot.settings?.voiceSettings?.speed || 1.0,
            pitch: result.bot.settings?.voiceSettings?.pitch || 1.0,
            language: result.bot.settings?.voiceSettings?.language || 'en-US'
          },
          headerColor: result.bot.settings?.headerColor || '#8b5cf6',
          footerColor: result.bot.settings?.footerColor || '#f8fafc',
          bodyColor: result.bot.settings?.bodyColor || '#ffffff',
          logo: result.bot.settings?.logo || '',
          widgetImages: result.bot.settings?.widgetImages || ['']
        })

        // Load conversation flows if they exist, otherwise initialize defaults
        if (result.bot.settings?.conversationFlows && result.bot.settings.conversationFlows.paths) {
          setPaths(result.bot.settings.conversationFlows.paths)
          const activePath = result.bot.settings.conversationFlows.paths.find(
            (p: Path) => p.id === result.bot.settings.conversationFlows.activePath
          )
          if (activePath) {
            setSelectedPath(activePath)
          } else {
            setSelectedPath(result.bot.settings.conversationFlows.paths[0])
          }
        } else {
          // Initialize with default structure and populate with form data
          setTimeout(() => {
            initializeDefaultPaths()
          }, 100)
        }
      } else {
        setError(result.error || 'Failed to fetch bot')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validate required fields
      if (!formData.webhookUrl.trim()) {
        showError('Webhook URL is required')
        return
      }

      // Validate voice settings
      if (formData.voiceEnabled) {
        if (formData.voiceSettings.speed < 0.25 || formData.voiceSettings.speed > 4.0) {
          showError('Voice speed must be between 0.25 and 4.0')
          return
        }
        if (formData.voiceSettings.pitch < 0.25 || formData.voiceSettings.pitch > 4.0) {
          showError('Voice pitch must be between 0.25 and 4.0')
          return
        }
      }

      // Clean up widget images array by removing empty strings
      const cleanedWidgetImages = (formData.widgetImages || []).filter((img: string) => img.trim() !== '')

      const settingsData = {
        webhookUrl: formData.webhookUrl,
        welcomeMessage: formData.welcomeMessage,
        fallbackMessage: formData.fallbackMessage,
        primaryColor: formData.primaryColor,
        widgetIcon: formData.widgetIcon,
        widgetIconType: formData.widgetIconType,
        widgetIconEmoji: formData.widgetIconEmoji,
        voiceEnabled: formData.voiceEnabled,
        voiceSettings: formData.voiceSettings,
        headerColor: formData.headerColor,
        footerColor: formData.footerColor,
        bodyColor: formData.bodyColor,
        logo: formData.logo,
        widgetImages: cleanedWidgetImages,
        // Save the conversation flows
        conversationFlows: {
          paths: paths,
          activePath: selectedPath.id
        }
      }

      console.log('Saving bot settings:', settingsData)

      const response = await fetch(`/api/bots/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: settingsData
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Save successful:', result)
        showSuccess('Bot settings updated successfully!')
        await fetchBot() // Refresh the bot data
      } else {
        const result = await response.json()
        console.error('Save failed:', result)
        showError(result.error || 'Failed to update bot')
      }
    } catch (err) {
      console.error('Save error:', err)
      showError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const testWebhook = async () => {
    setIsTestingWebhook(true)
    try {
      const response = await fetch(`/api/bots/${params.id}/test`)
      const result = await response.json()
      
      if (response.ok) {
        setTestResult(result)
        if (result.webhookTest.status === 'success') {
          showSuccess('Webhook is working correctly!')
        } else {
          showError('Webhook test failed - check configuration')
        }
      } else {
        showError('Failed to test webhook')
      }
    } catch (err) {
      showError('Failed to test webhook')
    } finally {
      setIsTestingWebhook(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVoiceSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        [field]: value
      }
    }))
  }

  const addNewNode = (type: FlowNode['type']) => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      title: getNodeTitle(type),
      content: getDefaultContent(type),
      position: { x: 100, y: 200 },
      connections: []
    }

    const updatedPath = {
      ...selectedPath,
      nodes: [...selectedPath.nodes, newNode]
    }

    setSelectedPath(updatedPath)
    setPaths(prevPaths => 
      prevPaths.map(path => 
        path.id === selectedPath.id ? updatedPath : path
      )
    )
    setSelectedNode(newNode)
  }

  const getNodeTitle = (type: FlowNode['type']): string => {
    switch (type) {
      case 'welcome': return 'Welcome Message'
      case 'message': return 'Send Message'
      case 'image': return 'Send Image'
      case 'pause': return 'Pause'
      case 'condition': return 'Condition'
      case 'webhook': return 'Webhook Call'
      default: return 'New Node'
    }
  }

  const getDefaultContent = (type: FlowNode['type']): string => {
    switch (type) {
      case 'welcome': return 'Hello! Welcome'
      case 'message': return 'Enter your message here...'
      case 'image': return ''
      case 'pause': return '2'
      case 'condition': return 'if condition'
      case 'webhook': return '/api/webhook'
      default: return ''
    }
  }

  const updateNodeContent = (nodeId: string, content: string) => {
    const updatedPath = {
      ...selectedPath,
      nodes: selectedPath.nodes.map(node =>
        node.id === nodeId ? { ...node, content } : node
      )
    }

    setSelectedPath(updatedPath)
    setPaths(prevPaths =>
      prevPaths.map(path =>
        path.id === selectedPath.id ? updatedPath : path
      )
    )

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, content })
    }
  }

  const deleteNode = (nodeId: string) => {
    const updatedPath = {
      ...selectedPath,
      nodes: selectedPath.nodes.filter(node => node.id !== nodeId)
    }

    setSelectedPath(updatedPath)
    setPaths(prevPaths =>
      prevPaths.map(path =>
        path.id === selectedPath.id ? updatedPath : path
      )
    )

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const addNewPath = (name: string) => {
    const newPath: Path = {
      id: `path-${Date.now()}`,
      name,
      isActive: false,
      nodes: []
    }

    setPaths(prevPaths => [...prevPaths, newPath])
    setSelectedPath(newPath)
  }

  const duplicatePath = (pathId: string) => {
    const pathToDuplicate = paths.find(p => p.id === pathId)
    if (pathToDuplicate) {
      const duplicatedPath: Path = {
        ...pathToDuplicate,
        id: `path-${Date.now()}`,
        name: `${pathToDuplicate.name} (Copy)`,
        isActive: false,
        nodes: pathToDuplicate.nodes.map(node => ({
          ...node,
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
      }
      setPaths(prevPaths => [...prevPaths, duplicatedPath])
      setSelectedPath(duplicatedPath)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const selectPathByType = (pathType: string) => {
    const path = paths.find(p => p.id === pathType)
    if (path) {
      setSelectedPath(path)
      setSelectedNode(null)
    }
  }

  const initializeDefaultPaths = () => {
    // Create default nodes based on current form data
    const defaultPaths: Path[] = [
      {
        id: 'welcome-new-user',
        name: 'Welcome new user',
        isActive: true,
        nodes: formData.welcomeMessage ? [{
          id: 'welcome-node-1',
          type: 'welcome',
          title: 'Welcome Message',
          content: formData.welcomeMessage,
          position: { x: 100, y: 100 },
          connections: []
        }] : []
      },
      {
        id: 'greet-returning-user',
        name: 'Greet returning user',
        isActive: false,
        nodes: []
      },
      {
        id: 'default-message',
        name: 'Default Message',
        isActive: false,
        nodes: formData.fallbackMessage ? [{
          id: 'fallback-node-1',
          type: 'message',
          title: 'Fallback Message',
          content: formData.fallbackMessage,
          position: { x: 100, y: 100 },
          connections: []
        }] : []
      },
      {
        id: 'post-resolution',
        name: 'Post resolution',
        isActive: false,
        nodes: []
      },
      {
        id: 'agent-unavailable',
        name: 'Agent Unavailable',
        isActive: false,
        nodes: []
      }
    ]
    
    setPaths(defaultPaths)
    setSelectedPath(defaultPaths[0])
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Bot Builder</h1>
        </header>
        <main className="flex-1 p-8 min-h-0">
          <div className="flex items-center justify-center h-64">
            <Loading size="lg" text="Loading bot settings..." />
          </div>
        </main>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Bot Builder</h1>
        </header>
        <main className="flex-1 p-8 min-h-0">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error || 'Bot not found'}</div>
          </div>
        </main>
      </div>
    )
  }

  const renderNodeIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <MessageSquare className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'pause':
        return <Clock className="h-4 w-4" />
      case 'condition':
        return <Share2 className="h-4 w-4" />
      case 'webhook':
        return <Globe className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const renderNode = (node: FlowNode, index: number) => {
    const isSelected = selectedNode?.id === node.id
    return (
      <div key={node.id} className="flex flex-col sm:flex-row items-stretch sm:items-center mb-3 sm:mb-2">
        <div 
          className={`flex-1 flex items-center p-4 sm:p-3 rounded-lg border cursor-pointer transition-all min-h-[60px] ${
            isSelected 
              ? 'border-orange-400 bg-orange-50' 
              : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
          }`}
          onClick={() => setSelectedNode(node)}
        >
          <div className={`p-2 sm:p-2 rounded-lg mr-3 flex-shrink-0 ${
            node.type === 'welcome' ? 'bg-orange-100 text-orange-600' :
            node.type === 'message' ? 'bg-orange-100 text-orange-600' :
            node.type === 'image' ? 'bg-blue-100 text-blue-600' :
            node.type === 'pause' ? 'bg-green-100 text-green-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {renderNodeIcon(node.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm sm:text-base">{node.title}</div>
            {node.content && (
              <div className="text-sm text-gray-500 truncate mt-1">
                {node.content.length > 40 ? `${node.content.substring(0, 40)}...` : node.content}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-9 w-9 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 active:bg-gray-200 rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedNode(node)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-9 w-9 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 active:bg-red-100 rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                deleteNode(node.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {index < selectedPath.nodes.length - 1 && (
          <div className="flex justify-center sm:justify-start py-2 sm:py-0 sm:mx-2">
            <ArrowRight className="h-4 w-4 text-gray-400 rotate-90 sm:rotate-0" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">{bot?.name || 'Bot Builder'}</h1>
            <p className="text-xs text-gray-500">{selectedPath.name}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveSection(activeSection === 'canvas' ? 'paths' : 'canvas')}
          className="p-2 rounded-lg"
        >
          {activeSection === 'canvas' ? <MessageSquare className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Left Sidebar */}
      <div className={`${activeSection === 'paths' ? 'block' : 'hidden'} lg:block w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="hidden lg:flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{bot?.name || '#LittUpLocal'}</h1>
              <p className="text-sm text-gray-500">Welcome new user</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search path..."
              className="pl-10 h-10 sm:h-9 bg-gray-50 border-gray-200 text-base sm:text-sm"
            />
          </div>
        </div>

        {/* Paths Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
              <button
                className="flex items-center font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                onClick={() => toggleSection('paths')}
              >
                {expandedSections.includes('paths') ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                Paths
              </button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={() => {
                  const pathName = prompt("Enter path name:")
                  if (pathName && pathName.trim()) {
                    addNewPath(pathName.trim())
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {expandedSections.includes('paths') && (
              <div className="space-y-1 mb-6">
                {paths.filter(path => path.id.startsWith('welcome-new-user') || path.id.startsWith('path-')).map((path) => (
                  <div
                    key={path.id}
                    className={`p-2 rounded-lg cursor-pointer transition-colors group ${
                      selectedPath.id === path.id
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPath(path)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{path.name}</span>
                      <div className="flex items-center space-x-1">
                        {path.isActive && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicatePath(path.id)
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
              </div>
              </div>
            </div>
                ))}
            </div>
            )}

            {/* Predefined conversation flows */}
            <div className="space-y-3">
              <button
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedPath.id === 'greet-returning-user'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectPathByType('greet-returning-user')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">Greet returning user</span>
            </div>
                  <div className="text-xs text-gray-500">
                    {paths.find(p => p.id === 'greet-returning-user')?.nodes.length || 0} nodes
              </div>
              </div>
              </button>
              
              <button
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedPath.id === 'default-message'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectPathByType('default-message')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">Default Message</span>
            </div>
                  <div className="text-xs text-gray-500">
                    {paths.find(p => p.id === 'default-message')?.nodes.length || 0} nodes
            </div>
                </div>
              </button>
              
              <button
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedPath.id === 'post-resolution'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectPathByType('post-resolution')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">Post resolution</span>
              </div>
                  <div className="text-xs text-gray-500">
                    {paths.find(p => p.id === 'post-resolution')?.nodes.length || 0} nodes
            </div>
                </div>
              </button>
              
                          <button
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedPath.id === 'agent-unavailable'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectPathByType('agent-unavailable')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">Agent Unavailable</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {paths.find(p => p.id === 'agent-unavailable')?.nodes.length || 0} nodes
                  </div>
                </div>
                          </button>
                      </div>
                    </div>
                  </div>
      </div>

      {/* Main Content Area */}
      <div className={`${activeSection === 'canvas' || activeSection === 'config' ? 'block' : 'hidden'} lg:block flex-1 flex flex-col`}>
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Builder</h2>
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-300 px-3 py-2 text-sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto overflow-x-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={testWebhook}
                disabled={isTestingWebhook || !formData.webhookUrl}
                className="px-3 py-2 text-sm min-h-[36px] flex-shrink-0"
              >
                <TestTube className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{isTestingWebhook ? 'Testing...' : 'Test'}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to reset this conversation flow? This will remove all nodes.')) {
                    const resetPath = {
                      ...selectedPath,
                      nodes: []
                    }
                    setSelectedPath(resetPath)
                    setPaths(prevPaths =>
                      prevPaths.map(path =>
                        path.id === selectedPath.id ? resetPath : path
                      )
                    )
                    setSelectedNode(null)
                  }
                }}
                className="px-3 py-2 text-sm min-h-[36px] flex-shrink-0"
              >
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm min-h-[36px] flex-shrink-0"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <ButtonLoading size="sm" />
                    <span className="ml-2 hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="px-3 py-2 text-sm min-h-[36px] flex-shrink-0 lg:hidden"
                onClick={() => setActiveSection('config')}
              >
                <Settings className="h-4 w-4" />
              </Button>
                    </div>
                    </div>
                  </div>

        {/* Flow Builder Canvas */}
        <div className="flex-1 flex">
          <div className="flex-1 p-3 sm:p-6 overflow-auto">
            <div className="max-w-4xl">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{selectedPath.name}</h3>
                    <p className="text-sm text-gray-500">Configure your conversation flow</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          addNewNode(e.target.value as FlowNode['type'])
                          e.target.value = ''
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[40px] flex-1 sm:flex-none"
                      defaultValue=""
                    >
                      <option value="" disabled>Add Node</option>
                      <option value="message">Send Message</option>
                      <option value="image">Send Image</option>
                      <option value="pause">Pause</option>
                      <option value="condition">Condition</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>
                </div>
                
                                {/* Flow visualization */}
                <div className="space-y-4">
                  {selectedPath.nodes.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No nodes in this path</h3>
                      <p className="text-sm sm:text-base text-gray-500 mb-4 px-4">Add your first node to start building the conversation flow</p>
                      <select 
                        onChange={(e) => {
                          if (e.target.value) {
                            addNewNode(e.target.value as FlowNode['type'])
                            e.target.value = ''
                          }
                        }}
                        className="px-4 py-3 border border-gray-300 rounded-md text-sm bg-white min-h-[44px] w-full max-w-xs"
                        defaultValue=""
                      >
                        <option value="" disabled>Add First Node</option>
                        <option value="welcome">Welcome Message</option>
                        <option value="message">Send Message</option>
                        <option value="image">Send Image</option>
                        <option value="pause">Pause</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPath.nodes.map((node, index) => renderNode(node, index))}
                </div>
                  )}
              </div>
            </div>
              </div>
            </div>

          {/* Right Configuration Panel */}
          <div className={`${activeSection === 'config' ? 'block' : 'hidden'} lg:block w-full lg:w-80 bg-white border-l border-gray-200 p-4 sm:p-6 absolute lg:relative top-0 left-0 right-0 bottom-0 lg:top-auto lg:left-auto lg:right-auto lg:bottom-auto z-10 lg:z-auto overflow-y-auto`}>
            {/* Mobile Configuration Header */}
            <div className="lg:hidden flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Configuration</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('canvas')}
                className="p-2 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedNode ? (
              <div>
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <div className={`p-2 rounded-lg ${
                    selectedNode.type === 'welcome' ? 'bg-orange-100 text-orange-600' :
                    selectedNode.type === 'message' ? 'bg-orange-100 text-orange-600' :
                    selectedNode.type === 'image' ? 'bg-blue-100 text-blue-600' :
                    selectedNode.type === 'pause' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {renderNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{selectedNode.title}</h3>
                    <p className="text-sm text-gray-500 capitalize">{selectedNode.type} node</p>
                  </div>
                </div>

                {selectedNode.type === 'welcome' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="welcomeContent" className="text-sm font-medium">
                        Welcome Message
              </Label>
                <Input
                        id="welcomeContent"
                        value={selectedNode.content}
                        onChange={(e) => updateNodeContent(selectedNode.id, e.target.value)}
                        placeholder="Hello! Welcome"
                        className="mt-1 h-12 text-base px-4 rounded-lg"
                />
              </div>
            </div>
                )}

                {selectedNode.type === 'message' && (
                  <div className="space-y-4">
              <div>
                      <Label htmlFor="messageContent" className="text-sm font-medium">
                        Message Content
              </Label>
                      <textarea
                        id="messageContent"
                        value={selectedNode.content}
                        onChange={(e) => updateNodeContent(selectedNode.id, e.target.value)}
                        placeholder="Enter your message..."
                        rows={4}
                        className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      />
                  </div>
              </div>
                )}

                {selectedNode.type === 'image' && (
                  <div className="space-y-4">
              <div>
                      <Label htmlFor="imageUrl" className="text-sm font-medium">
                        Image URL
                  </Label>
                      <Input
                        id="imageUrl"
                        value={selectedNode.content}
                        onChange={(e) => updateNodeContent(selectedNode.id, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1 h-12 text-base px-4 rounded-lg"
                      />
                </div>
                    {selectedNode.content && (
                      <div className="border border-gray-300 rounded-lg p-4">
                        <img 
                          src={selectedNode.content} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                </div>
                    )}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Upload or paste image URL</p>
              </div>
            </div>
                )}

                {selectedNode.type === 'pause' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pauseDuration" className="text-sm font-medium">
                        Pause Duration (seconds)
                  </Label>
                  <select
                        id="pauseDuration"
                        value={selectedNode.content}
                        onChange={(e) => updateNodeContent(selectedNode.id, e.target.value)}
                        className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      >
                        <option value="1">1 second</option>
                        <option value="2">2 seconds</option>
                        <option value="3">3 seconds</option>
                        <option value="5">5 seconds</option>
                        <option value="10">10 seconds</option>
                  </select>
                </div>
                  </div>
                )}

                {selectedNode.type === 'webhook' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="webhookUrl" className="text-sm font-medium">
                        Webhook URL
                    </Label>
                      <Input
                        id="webhookUrl"
                        value={selectedNode.content}
                        onChange={(e) => updateNodeContent(selectedNode.id, e.target.value)}
                        placeholder="/api/webhook"
                        className="mt-1 h-12 text-base px-4 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.type === 'condition' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="conditionLogic" className="text-sm font-medium">
                        Condition Logic
                    </Label>
                      <textarea
                        id="conditionLogic"
                        value={selectedNode.content}
                        onChange={(e) => updateNodeContent(selectedNode.id, e.target.value)}
                        placeholder="if user.message contains 'help'"
                        rows={3}
                        className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 py-3 px-4 text-base min-h-[48px] rounded-lg"
                    onClick={() => deleteNode(selectedNode.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Node
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bot Status Section */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-1">Bot Status</h4>
                      <div className="space-y-1">
                        <p className="text-sm text-blue-700">
                          Status: <span className="font-medium">{bot?.status || 'Loading...'}</span>
                        </p>
                        <p className="text-sm text-blue-700">
                          Webhook: {formData.webhookUrl ? (
                            <span className="text-green-600 font-medium">✓ Configured</span>
                          ) : (
                            <span className="text-orange-600 font-medium">⚠ Not configured</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Widget QR Code</h4>
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                      {/* QR Code - using a real QR code pattern based on bot URL */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(
                          `${typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/widget/${bot?._id || 'demo'}`
                        )}`}
                        alt="Bot QR Code"
                        className="w-full h-full rounded"
                        onError={(e) => {
                          // Fallback to pattern if QR service fails
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full bg-gray-300 rounded flex items-center justify-center">
                                <svg class="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clip-rule="evenodd"/>
                                </svg>
                  </div>
                            `
                          }
                        }}
                      />
                </div>
                    <p className="text-sm text-gray-600">Scan to test your bot</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Bot ID: {bot?._id ? bot._id.slice(-8) : 'loading...'}
                    </p>
                  </div>
                </div>

                {/* No Node Selected */}
                <div className="text-center text-gray-500 mt-8">
                  <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No node selected</h3>
                  <p className="text-sm">Select a node from the flow to configure its settings</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 