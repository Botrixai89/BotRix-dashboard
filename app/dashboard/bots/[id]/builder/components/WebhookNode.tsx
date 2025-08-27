import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Globe, Edit, Zap, TestTube, Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const WebhookNode = memo(({ data }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [url, setUrl] = useState(data.url || '')
  const [method, setMethod] = useState(data.method || 'POST')
  const [timeout, setTimeout] = useState(data.timeout || 30)
  const [description, setDescription] = useState(data.description || '')

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    data.url = newUrl
    data.onChange?.({ url: newUrl })
  }

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod)
    data.method = newMethod
    data.onChange?.({ method: newMethod })
  }

  const handleTimeoutChange = (newTimeout: number) => {
    setTimeout(newTimeout)
    data.timeout = newTimeout
    data.onChange?.({ timeout: newTimeout })
  }

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription)
    data.description = newDescription
    data.onChange?.({ description: newDescription })
  }

  const testWebhook = () => {
    if (!url) {
      alert('Please enter a webhook URL first')
      return
    }
    alert(`Testing webhook: ${method} ${url}`)
  }

  const openWebhook = () => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[350px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
      
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Globe className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label || 'Webhook'}</div>
          <div className="text-xs text-gray-500">Webhook Node</div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          {url && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={testWebhook}
                title="Test webhook"
              >
                <TestTube className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={openWebhook}
                title="Open webhook URL"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-700">Webhook URL</Label>
            <Input
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://api.example.com/webhook"
              className="mt-1 text-xs"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium text-gray-700">Method</Label>
              <Select value={method} onValueChange={handleMethodChange}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Timeout (s)</Label>
              <Input
                type="number"
                value={timeout}
                onChange={(e) => handleTimeoutChange(parseInt(e.target.value) || 30)}
                min="1"
                max="300"
                className="mt-1 text-xs"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs font-medium text-gray-700">Description (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="What does this webhook do?"
              className="mt-1 text-xs"
            />
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Zap className="h-3 w-3" />
            <span>Will call external API</span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-md p-3">
          {url ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="h-3 w-3 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {method} {url}
                  </div>
                  {description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {description}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">
                    Timeout: {timeout}s
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-indigo-600">
                  <Globe className="h-3 w-3" />
                  <span>Webhook</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Globe className="h-6 w-6 text-gray-400" />
              </div>
              <div className="text-xs text-gray-500">No webhook configured</div>
              <div className="text-xs text-gray-400 mt-1">Click edit to add webhook URL</div>
            </div>
          )}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  )
})

WebhookNode.displayName = 'WebhookNode'

export default WebhookNode
