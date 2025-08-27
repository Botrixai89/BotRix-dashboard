'use client'

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Panel,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, Edit, Trash2, MessageSquare, Save, Settings, Zap, Globe, Palette, TestTube, 
  AlertTriangle, CheckCircle, XCircle, Volume2, VolumeX, Play, Pause, Search, 
  ArrowRight, Copy, MoreVertical, Image, Clock, User, Home, FileText, Share2,
  ChevronDown, ChevronRight, RotateCcw, X, Workflow, Bot, Eye, Code, Download, Upload,
  Info, FileUp, Mic, Video, Link as LinkIcon, Database, Cpu, Zap as ZapIcon, Target, GitBranch,
  Layers, BarChart3, Users, Lightbulb, Settings as SettingsIcon, Puzzle, Network,
  Maximize2, Minimize2, Undo2, Redo2, ZoomIn, ZoomOut, FileText as FileTextIcon,
  UserCheck, Send, Bot as BotIcon, MessageCircle, Calendar, Mail, Phone, MapPin,
  ChevronLeft, Bell, RotateCw, Menu, PanelLeftClose, PanelRightClose
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { showSuccess, showError } from '@/lib/toast'
import { Loading, ButtonLoading } from '@/components/ui/loading'
import Link from 'next/link'

// Custom Node Components
import MessageNode from './components/MessageNode'
import ImageNode from './components/ImageNode'
import InputNode from './components/InputNode'
import PauseNode from './components/PauseNode'
import WebhookNode from './components/WebhookNode'
import ConditionNode from './components/ConditionNode'
import WelcomeNode from './components/WelcomeNode'

// Rule-based and Webhook Components
import RuleBuilder from './components/RuleBuilder'
import WebhookConfig from './components/WebhookConfig'

const nodeTypes: NodeTypes = {
  messageNode: MessageNode,
  imageNode: ImageNode,
  inputNode: InputNode,
  pauseNode: PauseNode,
  webhookNode: WebhookNode,
  conditionNode: ConditionNode,
  welcomeNode: WelcomeNode,
}

interface Bot {
  _id: string;
  name: string;
  status: string;
  settings: {
    webhookUrl: string;
    welcomeMessage: string;
    fallbackMessage: string;
    primaryColor: string;
    botType?: 'webhook' | 'rule-based' | 'hybrid';
    ruleBasedConfig?: {
      enabled: boolean;
      rules: any[];
      variables: Record<string, any>;
    };
    webhookConfig?: {
      primary: any;
      fallback: any;
      customWebhooks: any[];
    };
    conversationFlows?: {
      paths: any[];
      activePath: string;
    };
  };
}

interface FlowData {
  root: string;
  nodes: Record<string, any>;
  edges: Record<string, string[]>;
}

interface Path {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  flowData?: FlowData;
}

const NODE_CATEGORIES = {
  messaging: {
    name: 'Messaging',
    icon: MessageSquare,
    nodes: [
      { type: 'welcomeNode', name: 'Welcome Message', icon: MessageCircle, color: 'orange' },
      { type: 'messageNode', name: 'Send Message', icon: Send, color: 'blue' },
      { type: 'imageNode', name: 'Send Image', icon: Image, color: 'green' },
    ]
  },
  interaction: {
    name: 'Interaction',
    icon: User,
    nodes: [
      { type: 'inputNode', name: 'Get User Input', icon: UserCheck, color: 'purple' },
      { type: 'pauseNode', name: 'Pause', icon: Clock, color: 'yellow' },
    ]
  },
  logic: {
    name: 'Logic',
    icon: GitBranch,
    nodes: [
      { type: 'conditionNode', name: 'Condition', icon: Target, color: 'red' },
      { type: 'webhookNode', name: 'Webhook', icon: Globe, color: 'indigo' },
    ]
  }
}

export default function BotBuilderPage() {
  const params = useParams()
  const [bot, setBot] = useState<Bot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [activePath, setActivePath] = useState('welcome-new-user')
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [showNodePalette, setShowNodePalette] = useState(false)
  
  // Bot type and mode state
  const [botType, setBotType] = useState<'webhook' | 'rule-based' | 'hybrid'>('webhook')
  const [builderMode, setBuilderMode] = useState<'flow' | 'rules' | 'webhooks'>('flow')
  
  // Sidebar visibility state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Available paths based on the JSON structure
  const [paths, setPaths] = useState<Path[]>([
    { id: 'welcome-new-user', name: 'Welcome new user', description: 'Initial greeting for new users', isActive: true },
    { id: 'greet-returning-user', name: 'Greet returning user', description: 'Welcome back message', isActive: false },
    { id: 'default-fallback-msg', name: 'Default Message', description: 'Fallback response', isActive: false },
    { id: 'livechat-post-resolution', name: 'Post resolution', description: 'After issue resolution', isActive: false },
    { id: 'agent-unavailable-msg', name: 'Agent Unavailable', description: 'When agents are busy', isActive: false },
  ])

  useEffect(() => {
    fetchBot()
  }, [params.id])

  useEffect(() => {
    if (bot) {
      setBotType(bot.settings.botType || 'webhook')
    }
  }, [bot])

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 1024) // lg breakpoint
      
      // Auto-hide left sidebar on mobile
      if (width < 1024) {
        setLeftSidebarOpen(false)
      } else {
        setLeftSidebarOpen(true)
      }
    }

    handleResize() // Initial check
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchBot = async () => {
    try {
      const response = await fetch(`/api/bots/${params.id}`)
      const result = await response.json()

      if (response.ok) {
        setBot(result.bot)
        // Load existing flow data if available
        if (result.bot.settings?.conversationFlows) {
          loadFlowData(result.bot.settings.conversationFlows)
        } else {
          // Initialize with default welcome flow
          initializeDefaultFlow()
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

  const initializeDefaultFlow = () => {
    const defaultNodes: Node[] = [
      {
        id: 'start',
        type: 'welcomeNode',
        position: { x: 250, y: 100 },
        data: { 
          message: bot?.settings?.welcomeMessage || 'Hello! Welcome to our bot! 👋',
          label: 'Welcome Message'
        },
      },
      {
        id: 'get-user-input',
        type: 'inputNode',
        position: { x: 250, y: 300 },
        data: { 
          prompt: 'How can I help you today?',
          variable: 'user_query',
          label: 'Get User Input'
        },
      },
      {
        id: 'send-response',
        type: 'messageNode',
        position: { x: 250, y: 500 },
        data: { 
          message: 'Thank you for your message. I\'ll help you with that!',
          label: 'Send Response'
        },
      }
    ]

    const defaultEdges: Edge[] = [
      { id: 'e1', source: 'start', target: 'get-user-input', type: 'smoothstep' },
      { id: 'e2', source: 'get-user-input', target: 'send-response', type: 'smoothstep' },
    ]

    setNodes(defaultNodes)
    setEdges(defaultEdges)
  }

  const loadFlowData = (flowData: any) => {
    // Convert the JSON structure to React Flow format
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []

    // Process nodes
    Object.entries(flowData.nodes || {}).forEach(([nodeId, nodeData]: [string, any]) => {
      const nodeType = getNodeType(nodeData.type)
      const position = { x: Math.random() * 500, y: Math.random() * 400 }
      
      flowNodes.push({
        id: nodeId,
        type: nodeType,
        position,
        data: {
          ...nodeData,
          label: nodeData.node_name || nodeData.type,
        },
      })
    })

    // Process edges
    Object.entries(flowData.edges || {}).forEach(([sourceId, targets]: [string, any]) => {
      if (Array.isArray(targets)) {
        targets.forEach((targetId, index) => {
          flowEdges.push({
            id: `e-${sourceId}-${targetId}-${index}`,
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
          })
        })
      }
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
  }

  const getNodeType = (type: string): string => {
    switch (type) {
      case 'SEND_MSG':
        return 'messageNode'
      case 'SEND_IMAGE':
        return 'imageNode'
      case 'RCV_INP':
        return 'inputNode'
      case 'PAUSE_NODE':
        return 'pauseNode'
      case 'WEBHOOK':
        return 'webhookNode'
      case 'CONDITION':
        return 'conditionNode'
      default:
        return 'messageNode'
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { 
        label: `New ${type.replace('Node', '')}`,
        message: '',
        prompt: '',
        variable: '',
        duration: 2,
        url: '',
        condition: ''
      },
    }
    setNodes((nds) => nds.concat(newNode))
    setShowNodePalette(false)
  }

  const updateNodeData = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } }
        }
        return node
      })
    )
  }

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const saveFlow = async () => {
    setIsSaving(true)
    try {
      // Convert React Flow format back to the JSON structure
      const flowData: FlowData = {
        root: nodes[0]?.id || '',
        nodes: {},
        edges: {},
      }

      // Convert nodes
      nodes.forEach((node) => {
        flowData.nodes[node.id] = {
          node_key: node.id,
          type: getOriginalNodeType(node.type || ''),
          node_name: node.data.label,
          ...node.data,
        }
      })

      // Convert edges
      edges.forEach((edge) => {
        if (!flowData.edges[edge.source]) {
          flowData.edges[edge.source] = []
        }
        flowData.edges[edge.source].push(edge.target)
      })

      const response = await fetch(`/api/bots/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            ...bot?.settings,
            conversationFlows: {
              paths: paths.map(path => ({
                id: path.id,
                name: path.name,
                isActive: path.id === activePath,
                flowData: path.id === activePath ? flowData : null
              })),
              activePath: activePath
            }
          }
        }),
      })

      if (response.ok) {
        showSuccess('Flow saved successfully!')
      } else {
        const result = await response.json()
        showError(result.error || 'Failed to save flow')
      }
    } catch (err) {
      showError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getOriginalNodeType = (type: string): string => {
    switch (type) {
      case 'messageNode':
        return 'SEND_MSG'
      case 'imageNode':
        return 'SEND_IMAGE'
      case 'inputNode':
        return 'RCV_INP'
      case 'pauseNode':
        return 'PAUSE_NODE'
      case 'webhookNode':
        return 'WEBHOOK'
      case 'conditionNode':
        return 'CONDITION'
      default:
        return 'SEND_MSG'
    }
  }

  const exportFlow = () => {
    const flowData = {
      nodes,
      edges,
      activePath,
      botId: params.id,
    }
    const dataStr = JSON.stringify(flowData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `bot-flow-${params.id}-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const filteredPaths = paths.filter(path => 
    path.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    path.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading size="lg" text="Loading bot builder..." />
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="p-4 rounded-full bg-red-100 text-red-600 mb-4 inline-block">
            <Workflow className="h-8 w-8" />
          </div>
          <div className="text-red-600 font-medium">{error || 'Bot not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Left Sidebar - Path Management */}
        <div className={`${
          leftSidebarOpen ? 'w-80' : 'w-0'
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
          isMobile ? 'absolute left-0 top-0 h-full z-40' : 'relative'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Workflow className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Builder</h2>
              </div>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftSidebarOpen(false)}
                  className="lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Paths List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Paths</h3>
              <Button variant="outline" size="sm" className="h-7 px-2">
                <Plus className="h-3 w-3 mr-1" />
                Add Path
              </Button>
            </div>
            
            <div className="space-y-2">
              {filteredPaths.map((path) => (
                <div
                  key={path.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activePath === path.id
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setActivePath(path.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{path.name}</div>
                    {path.isActive && (
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{path.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Home, label: 'Home', active: false },
                { icon: MessageCircle, label: 'Chat', active: false },
                { icon: BarChart3, label: 'Analytics', active: false },
                { icon: Network, label: 'Share', active: true },
                { icon: Lightbulb, label: 'Ideas', active: false },
                { icon: Users, label: 'Team', active: false },
                { icon: SettingsIcon, label: 'Settings', active: false },
                { icon: Puzzle, label: 'Integrations', active: false },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={index}
                    className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors ${
                      item.active ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs hidden sm:block">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Flow Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          selectedNode ? 'mr-80' : ''
        }`}>
          {/* Top Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            {/* Mobile Menu Button */}
            {isMobile && (
              <div className="flex items-center mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftSidebarOpen(true)}
                  className="mr-2"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-gray-700">Bot Builder</span>
              </div>
            )}
            {/* Top Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard/bots" className="flex items-center text-gray-500 hover:text-gray-700">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Bots
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                    <MessageCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">#{bot.name}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="hidden lg:flex">
                  <User className="h-4 w-4 mr-2" />
                  Switch Account
                </Button>
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">R</span>
                </div>
              </div>
            </div>
            
            {/* Bottom Row - Active Path Tab */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                  {paths.find(p => p.id === activePath)?.name || 'Welcome new user'}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="hidden lg:flex">
                  <Info className="h-4 w-4 mr-2" />
                  Info
                </Button>
                <Button variant="outline" size="sm" className="hidden lg:flex">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm" className="hidden lg:flex">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mark Available
                </Button>
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Test
                </Button>
                <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1 hidden md:flex">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1 hidden lg:flex">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowNodePalette(!showNodePalette)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Node
                </Button>
              </div>
            </div>
          </div>

          {/* Bot Type and Mode Selection */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Bot Type</Label>
                  <Select value={botType} onValueChange={(value: any) => setBotType(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webhook">Webhook Bot</SelectItem>
                      <SelectItem value="rule-based">Rule-Based Bot</SelectItem>
                      <SelectItem value="hybrid">Hybrid Bot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Builder Mode</Label>
                  <div className="flex space-x-1">
                    <Button
                      variant={builderMode === 'flow' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBuilderMode('flow')}
                    >
                      <Workflow className="h-4 w-4 mr-2" />
                      Flow
                    </Button>
                    <Button
                      variant={builderMode === 'rules' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBuilderMode('rules')}
                    >
                      <GitBranch className="h-4 w-4 mr-2" />
                      Rules
                    </Button>
                    <Button
                      variant={builderMode === 'webhooks' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBuilderMode('webhooks')}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Webhooks
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Save bot type to database
                    fetch(`/api/bots/${params.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        settings: { ...bot.settings, botType }
                      })
                    });
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Bot Type
                </Button>
              </div>
            </div>
          </div>

          {/* Node Palette Overlay */}
          {showNodePalette && (
            <div className={`absolute top-20 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 ${
              isMobile ? 'left-4 right-4 w-auto' : 'right-4 w-80'
            }`} style={{ zIndex: 1000 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Add Node</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNodePalette(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {Object.entries(NODE_CATEGORIES).map(([categoryKey, category]) => {
                  const CategoryIcon = category.icon
                  return (
                    <div key={categoryKey}>
                      <div className="flex items-center space-x-2 mb-2">
                        <CategoryIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                      </div>
                      <div className="space-y-1">
                        {category.nodes.map((node) => {
                          const NodeIcon = node.icon
                          return (
                            <Button
                              key={node.type}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => addNode(node.type)}
                            >
                              <div className={`w-3 h-3 rounded-full bg-${node.color}-500 mr-2`}></div>
                              <NodeIcon className="h-4 w-4 mr-2" />
                              {node.name}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

                     {/* Conditional Rendering based on Builder Mode */}
           {builderMode === 'flow' && (
             /* React Flow Canvas */
             <div className={`flex-1 relative min-w-0 transition-all duration-300 ${
               selectedNode ? 'opacity-50 pointer-events-none' : ''
             }`}>
               <ReactFlow
                 nodes={nodes}
                 edges={edges}
                 onNodesChange={onNodesChange}
                 onEdgesChange={onEdgesChange}
                 onConnect={onConnect}
                 onNodeClick={onNodeClick}
                 onPaneClick={onPaneClick}
                 onInit={setReactFlowInstance}
                 nodeTypes={nodeTypes}
                 fitView
                 attributionPosition="bottom-left"
                 className="w-full h-full"
               >
                 <Background />
                 <Controls />
                 <MiniMap />
                 
                 {/* Flow Actions Panel */}
                 <Panel position="top-right" className="space-y-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={exportFlow}
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Export
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => window.open(`/test-widget.html?botId=${params.id}`, '_blank')}
                   >
                     <Eye className="h-4 w-4 mr-2" />
                     Test
                   </Button>
                   <Button
                     size="sm"
                     onClick={saveFlow}
                     disabled={isSaving}
                   >
                     {isSaving ? (
                       <>
                         <ButtonLoading size="sm" />
                         <span className="ml-2">Saving...</span>
                       </>
                     ) : (
                       <>
                         <Save className="h-4 w-4 mr-2" />
                         Save Flow
                       </>
                     )}
                   </Button>
                 </Panel>
                 
                 {/* Mobile Floating Action Button for Node Properties */}
                 {selectedNode && isMobile && (
                   <Panel position="bottom-right" className="mb-4">
                     <Button
                       size="sm"
                       onClick={() => setSelectedNode(null)}
                       className="shadow-lg"
                     >
                       <X className="h-4 w-4 mr-2" />
                       Close
                     </Button>
                   </Panel>
                 )}
               </ReactFlow>
             </div>
           )}

           {builderMode === 'rules' && (
             <div className="flex-1 p-6 overflow-y-auto">
               <RuleBuilder
                 botId={params.id as string}
                 initialRules={bot?.settings?.ruleBasedConfig?.rules || []}
                 onSave={async (rules) => {
                   try {
                     const response = await fetch(`/api/bots/${params.id}`, {
                       method: 'PUT',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                         settings: {
                           ...bot?.settings,
                           ruleBasedConfig: {
                             ...bot?.settings?.ruleBasedConfig,
                             enabled: true,
                             rules
                           }
                         }
                       })
                     });
                     if (response.ok) {
                       showSuccess('Rules saved successfully!');
                     } else {
                       showError('Failed to save rules');
                     }
                   } catch (error) {
                     showError('Error saving rules');
                   }
                 }}
                 onTest={(rule) => {
                   // Test rule functionality
                   console.log('Testing rule:', rule);
                   showSuccess('Rule test completed!');
                 }}
               />
             </div>
           )}

           {builderMode === 'webhooks' && (
             <div className="flex-1 p-6 overflow-y-auto">
               <WebhookConfig
                 botId={params.id as string}
                 initialConfig={bot?.settings?.webhookConfig || {
                   primary: {
                     url: '',
                     method: 'POST',
                     headers: {},
                     timeout: 30,
                     retryAttempts: 2,
                     isActive: true
                   },
                   fallback: {
                     url: '',
                     method: 'POST',
                     headers: {},
                     timeout: 30,
                     retryAttempts: 1,
                     isActive: false
                   },
                   customWebhooks: []
                 }}
                 onSave={async (config) => {
                   try {
                     const response = await fetch(`/api/bots/${params.id}`, {
                       method: 'PUT',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                         settings: {
                           ...bot?.settings,
                           webhookConfig: config
                         }
                       })
                     });
                     if (response.ok) {
                       showSuccess('Webhook configuration saved successfully!');
                     } else {
                       showError('Failed to save webhook configuration');
                     }
                   } catch (error) {
                     showError('Error saving webhook configuration');
                   }
                 }}
                 onTest={(webhook) => {
                   // Test webhook functionality
                   console.log('Testing webhook:', webhook);
                   showSuccess('Webhook test completed!');
                 }}
               />
             </div>
           )}
        </div>

        {/* Right Sidebar - Node Properties (AILifeBot Style) */}
        {selectedNode && (
          <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Node Properties</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="node-label" className="text-sm font-medium text-gray-700 mb-2 block">
                    Node Label
                  </Label>
                  <Input
                    id="node-label"
                    value={selectedNode.data.label || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                    className="w-full"
                    placeholder="Enter node label..."
                  />
                </div>

                {selectedNode.type === 'messageNode' && (
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                      Message
                    </Label>
                    <textarea
                      id="message"
                      value={selectedNode.data.message || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={6}
                      placeholder="Enter your message here..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Use curly braces to refer to user inputs or parameters. For example - {'{'}First Name{'}'}
                    </p>
                  </div>
                )}

                {selectedNode.type === 'imageNode' && (
                  <div>
                    <Label htmlFor="image-url" className="text-sm font-medium text-gray-700 mb-2 block">
                      Image URL
                    </Label>
                    <Input
                      id="image-url"
                      value={selectedNode.data.imageUrl || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { imageUrl: e.target.value })}
                      className="w-full"
                      placeholder="https://example.com/image.jpg"
                    />
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                )}

                {selectedNode.type === 'inputNode' && (
                  <>
                    <div>
                      <Label htmlFor="prompt" className="text-sm font-medium text-gray-700 mb-2 block">
                        Prompt Message
                      </Label>
                      <Input
                        id="prompt"
                        value={selectedNode.data.prompt || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                        className="w-full"
                        placeholder="How can I help you today?"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variable" className="text-sm font-medium text-gray-700 mb-2 block">
                        Variable Name
                      </Label>
                      <Input
                        id="variable"
                        value={selectedNode.data.variable || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { variable: e.target.value })}
                        className="w-full"
                        placeholder="user_query"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'pauseNode' && (
                  <div>
                    <Label htmlFor="duration" className="text-sm font-medium text-gray-700 mb-2 block">
                      Duration (seconds)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={selectedNode.data.duration || 2}
                      onChange={(e) => updateNodeData(selectedNode.id, { duration: parseInt(e.target.value) })}
                      className="w-full"
                      min="1"
                      max="60"
                    />
                  </div>
                )}

                {selectedNode.type === 'webhookNode' && (
                  <div>
                    <Label htmlFor="webhook-url" className="text-sm font-medium text-gray-700 mb-2 block">
                      Webhook URL
                    </Label>
                    <Input
                      id="webhook-url"
                      value={selectedNode.data.url || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                      className="w-full"
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                )}

                {selectedNode.type === 'conditionNode' && (
                  <div>
                    <Label htmlFor="condition" className="text-sm font-medium text-gray-700 mb-2 block">
                      Condition Logic
                    </Label>
                    <textarea
                      id="condition"
                      value={selectedNode.data.condition || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="if user.message contains 'help'"
                    />
                  </div>
                )}

                <div className="pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => deleteNode(selectedNode.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Node
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Backdrop Overlay */}
        {isMobile && (leftSidebarOpen || selectedNode) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => {
              setLeftSidebarOpen(false)
              setSelectedNode(null)
            }}
          />
        )}
      </div>
    </ReactFlowProvider>
  )
}
